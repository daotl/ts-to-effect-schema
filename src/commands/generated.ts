// import { Command, flags } from '@oclif/command'
import type { OutputFlags } from '@oclif/core/lib/interfaces/parser'
import { Command, Flags, Args, Errors } from '@oclif/core'
import type { WritableDeep } from 'type-fest'
// import { OutputFlags } from '@oclif/parser'
// import { error as oclifError } from '@oclif/errors'
import { readFile, outputFile, existsSync } from 'fs-extra'
import { join, relative, parse } from 'path'
import slash from 'slash'
import ts from 'typescript'
import { generate, GenerateProps } from '../core/generate'
import { TsToEffectConfig, Config } from '../config'
import {
  tsToEffectConfigSchema,
  // getSchemaNameSchema,
  // nameFilterSchema,
} from '../config.schema'
import { getImportPath } from '../utils/getImportPath'
import ora from 'ora'
import prettier from 'prettier'
import * as worker from '../worker'
import inquirer from 'inquirer'
import { eachSeries } from 'async'
import { createConfig } from '../createConfig'
import chokidar from 'chokidar'
import * as S from '@effect/schema/Schema'

type ConfigExt = '.js' | '.cjs'

// Try to load `ts-to-effect-schema.config.js`
// We are doing this here to be able to infer the `flags` & `usage` in the index help
const tsToEffectConfig = 'ts-to-effect-schema.config'
const configPath = join(process.cwd(), tsToEffectConfig)
let config: TsToEffectConfig | undefined
let haveMultiConfig = false
const configKeys: string[] = []

let configExt: ConfigExt | undefined
try {
  if (existsSync(`${configPath}.js`)) {
    configExt = '.js'
  } else if (existsSync(`${configPath}.cjs`)) {
    configExt = '.cjs'
  }

  if (configExt) {
    const rawConfig = require(slash(
      relative(__dirname, `${configPath}${configExt}`),
    ))
    const c = S.parse(tsToEffectConfigSchema)(rawConfig)
    config = c as WritableDeep<typeof c>

    if (Array.isArray(config)) {
      haveMultiConfig = true
      configKeys.push(...config.map((c) => c.name))
    }
  }
} catch (e) {
  if (e instanceof Error) {
    new Errors.CLIError(
      `"${tsToEffectConfig}${configExt}" invalid:
  ${e.message}

  Please fix the invalid configuration
  You can generate a new config with --init`,
      { exit: false },
    )
  }
  process.exit(2)
}

class TsToEffect extends Command {
  static description = 'Generate Effect schemas from a Typescript file'

  static usage = haveMultiConfig
    ? [
      '--all',
      ...configKeys.map(
        (key) => `--config ${key.includes(' ') ? `"${key}"` : key}`,
      ),
    ]
    : undefined

  static flags = {
    version: Flags.version({ char: 'v' }),
    help: Flags.help({ char: 'h' }),
    esm: Flags.boolean({
      default: false,
      description:
        'Generate TypeScript import statements in ESM format (with ".js" extension)',
    }),
    keepComments: Flags.boolean({
      char: 'k',
      description: 'Keep parameters comments',
    }),
    init: Flags.boolean({
      char: 'i',
      description: 'Create a ts-to-effect-schema.config.js file',
    }),
    skipParseJSDoc: Flags.boolean({
      default: false,
      description:
        'Skip the creation of effect schema validators from JSDoc annotations',
    }),
    skipValidation: Flags.boolean({
      default: false,
      description: 'Skip the validation step (not recommended)',
    }),
    inferredTypes: Flags.string({
      description: 'Path of S.To<> types file',
    }),
    watch: Flags.boolean({
      char: 'w',
      default: false,
      description: 'Watch input file(s) for changes and re-run related task',
    }),
    config: Flags.string({ char: 'c', options: configKeys, description: 'Execute one config', hidden: !haveMultiConfig, }),
    // -- Multi config flags --
    // config: Flags.enum({
    //   char: 'c',
    //   options: configKeys,
    //   description: 'Execute one config',
    //   hidden: !haveMultiConfig,
    // }),
    all: Flags.boolean({
      char: 'a',
      default: false,
      description: 'Execute all configs',
      hidden: !haveMultiConfig,
    }),
  }

  static args = {
    input: Args.string({ description: 'input file (typescript)' }),
    output: Args.string({ description: 'output file (effect schemas)' }),
  }

  async run() {
    const { args, flags } = await this.parse(TsToEffect)
    if (flags.init) {
      ; (await createConfig(configPath))
        ? this.log('🧐 ts-to-effect-schema.config.js created!')
        : this.log('Nothing changed!')
      return
    }

    const fileConfig = await this.loadFileConfig(
      config,
      flags,
      configExt as ConfigExt,
    )

    if (Array.isArray(fileConfig)) {
      if (args.input || args.output) {
        this.error('INPUT and OUTPUT arguments are not compatible with --all')
      }
      await eachSeries(fileConfig, async (config) => {
        this.log(`Generating "${config.name}"`)
        const result = await this.generate(args, config, flags)
        if (result.success) {
          this.log(' 🎉 Effect schemas generated!')
        } else {
          this.error(result.error, { exit: false })
        }
        this.log() // empty line between configs
      }).catch((e) => this.error(e, { exit: false }))
    } else {
      const result = await this.generate(args, fileConfig, flags)
      if (result.success) {
        this.log('🎉 Effect schemas generated!')
      } else {
        this.error(result.error)
      }
    }

    if (flags.watch) {
      const inputs = Array.isArray(fileConfig)
        ? fileConfig.map((i) => i.input)
        : fileConfig?.input || args.input

      this.log('\nWatching for changes…')
      chokidar.watch(inputs as string).on('change', async (path) => {
        console.clear()
        this.log(`Changes detected in "${slash(path)}"`)
        const config = Array.isArray(fileConfig)
          ? fileConfig.find((i) => i.input === slash(path))
          : fileConfig

        const result = await this.generate(args, config, flags)
        if (result.success) {
          this.log('🎉 Effect schemas generated!')
        } else {
          this.error(result.error)
        }
        this.log('\nWatching for changes…')
      })
    }
  }

  /**
   * Generate on effect schema file.
   * @param args
   * @param fileConfig
   * @param flags
   */
  async generate(
    args: { input?: string; output?: string },
    fileConfig: Config | undefined,
    flags: OutputFlags<typeof TsToEffect.flags>,
  ): Promise<{ success: true } | { success: false; error: string }> {
    const input = args.input || fileConfig?.input
    const output = args.output || fileConfig?.output

    if (!input) {
      return {
        success: false,
        error: `Missing 1 required arg:
${TsToEffect.args.input}
See more help with --help`,
      }
    }

    const inputPath = join(process.cwd(), input)
    const outputPath = join(process.cwd(), output || input)

    // Check args/flags file extensions
    const extErrors: { path: string; expectedExtensions: string[] }[] = []
    if (!hasExtensions(input, typescriptExtensions)) {
      extErrors.push({
        path: input,
        expectedExtensions: typescriptExtensions,
      })
    }
    if (
      output &&
      !hasExtensions(output, [...typescriptExtensions, ...javascriptExtensions])
    ) {
      extErrors.push({
        path: output,
        expectedExtensions: [...typescriptExtensions, ...javascriptExtensions],
      })
    }

    if (extErrors.length) {
      return {
        success: false,
        error: `Unexpected file extension:\n${extErrors
          .map(
            ({ path, expectedExtensions }) =>
              `"${path}" must be ${expectedExtensions
                .map((i) => `"${i}"`)
                .join(', ')}`,
          )
          .join('\n')}`,
      }
    }

    const sourceText = await readFile(inputPath, 'utf-8')

    const generateOptions: GenerateProps = {
      sourceText,
      ...fileConfig,
    }
    if (typeof flags.keepComments === 'boolean') {
      generateOptions.keepComments = flags.keepComments
    }
    if (typeof flags.skipParseJSDoc === 'boolean') {
      generateOptions.skipParseJSDoc = flags.skipParseJSDoc
    }
    if (typeof flags.inferredTypes === 'string') {
      generateOptions.inferredTypes = flags.inferredTypes
    }

    const {
      errors,
      transformedSourceText,
      getEffectSchemasFile,
      getIntegrationTestFile,
      getInferredTypes,
      hasCircularDependencies,
    } = generate(generateOptions)

    if (hasCircularDependencies && !output) {
      return {
        success: false,
        error:
          '--output= must also be provided when input file have some circular dependencies',
      }
    }

    errors.map(this.warn)

    if (!flags.skipValidation) {
      const validatorSpinner = ora('Validating generated types').start()

      if (flags.all) {
        validatorSpinner.indent = 1
      }
      const generationErrors = await worker.validateGeneratedTypesInWorker({
        sourceTypes: {
          sourceText: transformedSourceText,
          relativePath: './source.ts',
        },
        integrationTests: {
          sourceText: getIntegrationTestFile('./source', './source.schema'),
          relativePath: './source.integration.ts',
        },
        effectSchemas: {
          sourceText: getEffectSchemasFile('./source', sourceText),
          relativePath: './source.schema.ts',
        },
        skipParseJSDoc: Boolean(generateOptions.skipParseJSDoc),
      })

      generationErrors.length
        ? validatorSpinner.fail()
        : validatorSpinner.succeed()

      if (generationErrors.length > 0) {
        return {
          success: false,
          error: generationErrors.join('\n'),
        }
      }
    }

    const effectSchemasFile = getEffectSchemasFile(
      getImportPath(outputPath, inputPath) + (flags.esm ? '.js' : ''),
      sourceText,
    )

    const prettierConfig = await prettier.resolveConfig(process.cwd())

    if (generateOptions.inferredTypes) {
      const effectInferredTypesFile = getInferredTypes(
        getImportPath(generateOptions.inferredTypes, outputPath),
      )
      await outputFile(
        generateOptions.inferredTypes,
        prettier.format(
          hasExtensions(generateOptions.inferredTypes, javascriptExtensions)
            ? ts.transpileModule(effectInferredTypesFile, {
              compilerOptions: {
                target: ts.ScriptTarget.Latest,
                module: ts.ModuleKind.ESNext,
                newLine: ts.NewLineKind.LineFeed,
              },
            }).outputText
            : effectInferredTypesFile,
          { parser: 'babel-ts', ...prettierConfig },
        ),
      )
    }

    if (output && hasExtensions(output, javascriptExtensions)) {
      await outputFile(
        outputPath,
        prettier.format(
          ts.transpileModule(effectSchemasFile, {
            compilerOptions: {
              target: ts.ScriptTarget.Latest,
              module: ts.ModuleKind.ESNext,
              newLine: ts.NewLineKind.LineFeed,
            },
          }).outputText,
          { parser: 'babel-ts', ...prettierConfig },
        ),
      )
    } else {
      await outputFile(
        outputPath,
        prettier.format(effectSchemasFile, {
          parser: 'babel-ts',
          ...prettierConfig,
        }),
      )
    }
    return { success: true }
  }

  /**
   * Load user config from `ts-to-effect-schema.config.js`
   */
  async loadFileConfig(
    config: TsToEffectConfig | undefined,
    flags: OutputFlags<typeof TsToEffect.flags>,
    ext: ConfigExt,
  ): Promise<TsToEffectConfig | undefined> {
    if (!config) {
      return undefined
    }
    if (Array.isArray(config)) {
      if (!flags.all && !flags.config) {
        const { mode } = await inquirer.prompt<{
          mode: 'none' | 'multi' | `single-${string}`
        }>([
          {
            name: 'mode',
            message: `You have multiple configs available in "${tsToEffectConfig}${ext}"\n What do you want?`,
            type: 'list',
            choices: [
              {
                value: 'multi',
                name: `${TsToEffect.flags.all.description} (--all)`,
              },
              ...configKeys.map((key) => ({
                value: `single-${key}`,
                name: `Execute "${key}" config (--config=${key})`,
              })),
              { value: 'none', name: "Don't use the config" },
            ],
          },
        ])
        if (mode.startsWith('single-')) {
          flags.config = mode.slice('single-'.length)
        } else if (mode === 'multi') {
          flags.all = true
        }
      }
      if (flags.all) {
        return config
      }
      if (flags.config) {
        const selectedConfig = config.find((c) => c.name === flags.config)
        if (!selectedConfig) {
          this.error(`${flags.config} configuration not found!`)
        }
        return selectedConfig
      }
      return undefined
    }

    return {
      ...config,
      getSchemaName: config.getSchemaName
        ? config.getSchemaName //getSchemaNameSchema.implement(config.getSchemaName)
        : undefined,
      nameFilter: config.nameFilter
        ? config.nameFilter // nameFilterSchema.implement(config.nameFilter)
        : undefined,
    }
  }
}

const typescriptExtensions = ['.ts', '.tsx']
const javascriptExtensions = ['.js', '.jsx']

/**
 * Validate if the file extension is ts or tsx.
 *
 * @param path relative path
 * @param extensions list of allowed extensions
 * @returns true if the extension is valid
 */
function hasExtensions(path: string, extensions: string[]) {
  const { ext } = parse(path)
  return extensions.includes(ext)
}

export = TsToEffect

"use strict";
const tslib_1 = require("tslib");
const core_1 = require("@oclif/core");
// import { OutputFlags } from '@oclif/parser'
// import { error as oclifError } from '@oclif/errors'
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const slash_1 = tslib_1.__importDefault(require("slash"));
const typescript_1 = tslib_1.__importDefault(require("typescript"));
const generate_1 = require("../core/generate");
const config_schema_1 = require("../config.schema");
const getImportPath_1 = require("../utils/getImportPath");
const ora_1 = tslib_1.__importDefault(require("ora"));
const prettier_1 = tslib_1.__importDefault(require("prettier"));
const worker = tslib_1.__importStar(require("../worker"));
const inquirer_1 = tslib_1.__importDefault(require("inquirer"));
const async_1 = require("async");
const createConfig_1 = require("../createConfig");
const chokidar_1 = tslib_1.__importDefault(require("chokidar"));
const S = tslib_1.__importStar(require("@effect/schema/Schema"));
// Try to load `ts-to-effect-schema.config.js`
// We are doing this here to be able to infer the `flags` & `usage` in the index help
const tsToEffectConfig = 'ts-to-effect-schema.config';
const configPath = (0, path_1.join)(process.cwd(), tsToEffectConfig);
let config;
let haveMultiConfig = false;
const configKeys = [];
let configExt;
try {
    if ((0, fs_extra_1.existsSync)(`${configPath}.js`)) {
        configExt = '.js';
    }
    else if ((0, fs_extra_1.existsSync)(`${configPath}.cjs`)) {
        configExt = '.cjs';
    }
    if (configExt) {
        const rawConfig = require((0, slash_1.default)((0, path_1.relative)(__dirname, `${configPath}${configExt}`)));
        const c = S.parse(config_schema_1.tsToEffectConfigSchema)(rawConfig);
        config = c;
        if (Array.isArray(config)) {
            haveMultiConfig = true;
            configKeys.push(...config.map((c) => c.name));
        }
    }
}
catch (e) {
    if (e instanceof Error) {
        new core_1.Errors.CLIError(`"${tsToEffectConfig}${configExt}" invalid:
  ${e.message}

  Please fix the invalid configuration
  You can generate a new config with --init`, { exit: false });
    }
    process.exit(2);
}
class TsToEffect extends core_1.Command {
    async run() {
        const { args, flags } = await this.parse(TsToEffect);
        if (flags.init) {
            ;
            (await (0, createConfig_1.createConfig)(configPath))
                ? this.log('🧐 ts-to-effect-schema.config.js created!')
                : this.log('Nothing changed!');
            return;
        }
        const fileConfig = await this.loadFileConfig(config, flags, configExt);
        if (Array.isArray(fileConfig)) {
            if (args.input || args.output) {
                this.error('INPUT and OUTPUT arguments are not compatible with --all');
            }
            await (0, async_1.eachSeries)(fileConfig, async (config) => {
                this.log(`Generating "${config.name}"`);
                const result = await this.generate(args, config, flags);
                if (result.success) {
                    this.log(' 🎉 Effect schemas generated!');
                }
                else {
                    this.error(result.error, { exit: false });
                }
                this.log(); // empty line between configs
            }).catch((e) => this.error(e, { exit: false }));
        }
        else {
            const result = await this.generate(args, fileConfig, flags);
            if (result.success) {
                this.log('🎉 Effect schemas generated!');
            }
            else {
                this.error(result.error);
            }
        }
        if (flags.watch) {
            const inputs = Array.isArray(fileConfig)
                ? fileConfig.map((i) => i.input)
                : (fileConfig === null || fileConfig === void 0 ? void 0 : fileConfig.input) || args.input;
            this.log('\nWatching for changes…');
            chokidar_1.default.watch(inputs).on('change', async (path) => {
                console.clear();
                this.log(`Changes detected in "${(0, slash_1.default)(path)}"`);
                const config = Array.isArray(fileConfig)
                    ? fileConfig.find((i) => i.input === (0, slash_1.default)(path))
                    : fileConfig;
                const result = await this.generate(args, config, flags);
                if (result.success) {
                    this.log('🎉 Effect schemas generated!');
                }
                else {
                    this.error(result.error);
                }
                this.log('\nWatching for changes…');
            });
        }
    }
    /**
     * Generate on effect schema file.
     * @param args
     * @param fileConfig
     * @param flags
     */
    async generate(args, fileConfig, flags) {
        const input = args.input || (fileConfig === null || fileConfig === void 0 ? void 0 : fileConfig.input);
        const output = args.output || (fileConfig === null || fileConfig === void 0 ? void 0 : fileConfig.output);
        if (!input) {
            return {
                success: false,
                error: `Missing 1 required arg:
${TsToEffect.args.input}
See more help with --help`,
            };
        }
        const inputPath = (0, path_1.join)(process.cwd(), input);
        const outputPath = (0, path_1.join)(process.cwd(), output || input);
        // Check args/flags file extensions
        const extErrors = [];
        if (!hasExtensions(input, typescriptExtensions)) {
            extErrors.push({
                path: input,
                expectedExtensions: typescriptExtensions,
            });
        }
        if (output &&
            !hasExtensions(output, [...typescriptExtensions, ...javascriptExtensions])) {
            extErrors.push({
                path: output,
                expectedExtensions: [...typescriptExtensions, ...javascriptExtensions],
            });
        }
        if (extErrors.length) {
            return {
                success: false,
                error: `Unexpected file extension:\n${extErrors
                    .map(({ path, expectedExtensions }) => `"${path}" must be ${expectedExtensions
                    .map((i) => `"${i}"`)
                    .join(', ')}`)
                    .join('\n')}`,
            };
        }
        const sourceText = await (0, fs_extra_1.readFile)(inputPath, 'utf-8');
        const generateOptions = Object.assign({ sourceText }, fileConfig);
        if (typeof flags.keepComments === 'boolean') {
            generateOptions.keepComments = flags.keepComments;
        }
        if (typeof flags.skipParseJSDoc === 'boolean') {
            generateOptions.skipParseJSDoc = flags.skipParseJSDoc;
        }
        if (typeof flags.inferredTypes === 'string') {
            generateOptions.inferredTypes = flags.inferredTypes;
        }
        const { errors, transformedSourceText, getEffectSchemasFile, getIntegrationTestFile, getInferredTypes, hasCircularDependencies, } = (0, generate_1.generate)(generateOptions);
        if (hasCircularDependencies && !output) {
            return {
                success: false,
                error: '--output= must also be provided when input file have some circular dependencies',
            };
        }
        errors.map(this.warn);
        if (!flags.skipValidation) {
            const validatorSpinner = (0, ora_1.default)('Validating generated types').start();
            if (flags.all) {
                validatorSpinner.indent = 1;
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
            });
            generationErrors.length
                ? validatorSpinner.fail()
                : validatorSpinner.succeed();
            if (generationErrors.length > 0) {
                return {
                    success: false,
                    error: generationErrors.join('\n'),
                };
            }
        }
        const effectSchemasFile = getEffectSchemasFile((0, getImportPath_1.getImportPath)(outputPath, inputPath) + (flags.esm ? '.js' : ''), sourceText);
        const prettierConfig = await prettier_1.default.resolveConfig(process.cwd());
        if (generateOptions.inferredTypes) {
            const effectInferredTypesFile = getInferredTypes((0, getImportPath_1.getImportPath)(generateOptions.inferredTypes, outputPath));
            await (0, fs_extra_1.outputFile)(generateOptions.inferredTypes, prettier_1.default.format(hasExtensions(generateOptions.inferredTypes, javascriptExtensions)
                ? typescript_1.default.transpileModule(effectInferredTypesFile, {
                    compilerOptions: {
                        target: typescript_1.default.ScriptTarget.Latest,
                        module: typescript_1.default.ModuleKind.ESNext,
                        newLine: typescript_1.default.NewLineKind.LineFeed,
                    },
                }).outputText
                : effectInferredTypesFile, Object.assign({ parser: 'babel-ts' }, prettierConfig)));
        }
        if (output && hasExtensions(output, javascriptExtensions)) {
            await (0, fs_extra_1.outputFile)(outputPath, prettier_1.default.format(typescript_1.default.transpileModule(effectSchemasFile, {
                compilerOptions: {
                    target: typescript_1.default.ScriptTarget.Latest,
                    module: typescript_1.default.ModuleKind.ESNext,
                    newLine: typescript_1.default.NewLineKind.LineFeed,
                },
            }).outputText, Object.assign({ parser: 'babel-ts' }, prettierConfig)));
        }
        else {
            await (0, fs_extra_1.outputFile)(outputPath, prettier_1.default.format(effectSchemasFile, Object.assign({ parser: 'babel-ts' }, prettierConfig)));
        }
        return { success: true };
    }
    /**
     * Load user config from `ts-to-effect-schema.config.js`
     */
    async loadFileConfig(config, flags, ext) {
        if (!config) {
            return undefined;
        }
        if (Array.isArray(config)) {
            if (!flags.all && !flags.config) {
                const { mode } = await inquirer_1.default.prompt([
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
                ]);
                if (mode.startsWith('single-')) {
                    flags.config = mode.slice('single-'.length);
                }
                else if (mode === 'multi') {
                    flags.all = true;
                }
            }
            if (flags.all) {
                return config;
            }
            if (flags.config) {
                const selectedConfig = config.find((c) => c.name === flags.config);
                if (!selectedConfig) {
                    this.error(`${flags.config} configuration not found!`);
                }
                return selectedConfig;
            }
            return undefined;
        }
        return Object.assign(Object.assign({}, config), { getSchemaName: config.getSchemaName
                ? config.getSchemaName //getSchemaNameSchema.implement(config.getSchemaName)
                : undefined, nameFilter: config.nameFilter
                ? config.nameFilter // nameFilterSchema.implement(config.nameFilter)
                : undefined });
    }
}
TsToEffect.description = 'Generate Effect schemas from a Typescript file';
TsToEffect.usage = haveMultiConfig
    ? [
        '--all',
        ...configKeys.map((key) => `--config ${key.includes(' ') ? `"${key}"` : key}`),
    ]
    : undefined;
TsToEffect.flags = {
    version: core_1.Flags.version({ char: 'v' }),
    help: core_1.Flags.help({ char: 'h' }),
    esm: core_1.Flags.boolean({
        default: false,
        description: 'Generate TypeScript import statements in ESM format (with ".js" extension)',
    }),
    keepComments: core_1.Flags.boolean({
        char: 'k',
        description: 'Keep parameters comments',
    }),
    init: core_1.Flags.boolean({
        char: 'i',
        description: 'Create a ts-to-effect-schema.config.js file',
    }),
    skipParseJSDoc: core_1.Flags.boolean({
        default: false,
        description: 'Skip the creation of effect schema validators from JSDoc annotations',
    }),
    skipValidation: core_1.Flags.boolean({
        default: false,
        description: 'Skip the validation step (not recommended)',
    }),
    inferredTypes: core_1.Flags.string({
        description: 'Path of S.To<> types file',
    }),
    watch: core_1.Flags.boolean({
        char: 'w',
        default: false,
        description: 'Watch input file(s) for changes and re-run related task',
    }),
    config: core_1.Flags.string({ char: 'c', options: configKeys, description: 'Execute one config', hidden: !haveMultiConfig, }),
    // -- Multi config flags --
    // config: Flags.enum({
    //   char: 'c',
    //   options: configKeys,
    //   description: 'Execute one config',
    //   hidden: !haveMultiConfig,
    // }),
    all: core_1.Flags.boolean({
        char: 'a',
        default: false,
        description: 'Execute all configs',
        hidden: !haveMultiConfig,
    }),
};
TsToEffect.args = {
    input: core_1.Args.string({ description: 'input file (typescript)' }),
    output: core_1.Args.string({ description: 'output file (effect schemas)' }),
};
const typescriptExtensions = ['.ts', '.tsx'];
const javascriptExtensions = ['.js', '.jsx'];
/**
 * Validate if the file extension is ts or tsx.
 *
 * @param path relative path
 * @param extensions list of allowed extensions
 * @returns true if the extension is valid
 */
function hasExtensions(path, extensions) {
    const { ext } = (0, path_1.parse)(path);
    return extensions.includes(ext);
}
module.exports = TsToEffect;
//# sourceMappingURL=generated.js.map
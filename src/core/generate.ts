import { camel } from 'case'
import { getJsDoc } from 'tsutils'
import ts from 'typescript'
import { JSDocTagFilter, NameFilter } from '../config'
import { getSimplifiedJsDocTags } from '../utils/getSimplifiedJsDocTags'
import { resolveModules } from '../utils/resolveModules'
import {
  getExtractedTypeNames,
  isTypeNode,
  TypeNode,
} from '../utils/traverseTypes'
import { generateIntegrationTests } from './generateIntegrationTests'
import { generateSchemaInferredType } from './generateSchemaInferredType'
import { generateSchemaVariableStatement } from './generateSchema'
import { transformRecursiveSchema } from './transformRecursiveSchema'
import { standardBuiltInObjectVarNames } from './const'

const getSchemaNameList =
  (nameList: string[] = []) => (statement?: ts.VariableStatement | string) => {
    if (!statement) {
      return nameList
    }

    if (typeof statement === 'string') {
      if (!nameList.includes(statement)) {
        nameList.push(statement)
      }
      return nameList
    }
    const getEscapedTextFun = (data: Record<string, unknown>) => {
      for (const [key, item] of Object.entries(data)) {
        if (
          !item ||
          typeof item !== 'object' ||
          ['modifiers', 'emitNode'].includes(key)
        ) {
          continue
        }
        const escapedText = (item as unknown as { escapedText: string })
          .escapedText
        if (escapedText && !nameList.includes(escapedText)) {
          nameList.push(escapedText)
        }

        if (Array.isArray(item)) {
          item.forEach(getEscapedTextFun)
          continue
        }
        getEscapedTextFun(item as Record<string, unknown>)
      }
    }
    getEscapedTextFun(statement as unknown as Record<string, unknown>)

    return nameList
  }

export interface GenerateProps {
  /**
   * Content of the typescript source file.
   */
  sourceText: string

  /**
   * Filter on type/interface name.
   */
  nameFilter?: NameFilter

  /**
   * Filter on JSDocTag.
   */
  jsDocTagFilter?: JSDocTagFilter

  /**
   * Schema name generator.
   */
  getSchemaName?: (identifier: string) => string

  /**
   * Keep parameters comments.
   * @default false
   */
  keepComments?: boolean

  /**
   * Skip the creation of effect validators from JSDoc annotations
   *
   * @default false
   */
  skipParseJSDoc?: boolean

  /**
   * Path of S.To<> types file.
   */
  inferredTypes?: string
}

/**
 * Generate effect schemas and integration tests from a typescript file.
 *
 * This function take care of the sorting of the `const` declarations and solved potential circular references
 */
export function generate({
  sourceText,
  nameFilter = () => true,
  jsDocTagFilter = () => true,
  getSchemaName = (id) => `${camel(id)}Schema`,
  keepComments = false,
  skipParseJSDoc = false,
}: GenerateProps) {
  // Create a source file and deal with modules
  const sourceFile = resolveModules(sourceText)

  // Extract the nodes (interface declarations & type aliases)
  const nodes: TypeNode[] = []
  // The schema name used
  const getSchemaNameFun = getSchemaNameList()

  // declare a map to store the interface name and its corresponding effect schema
  const typeNameMapping = new Map<string, TypeNode>()

  const typesNeedToBeExtracted = new Set<string>()

  const typeNameMapBuilder = (node: ts.Node) => {
    if (isTypeNode(node)) {
      typeNameMapping.set(node.name.text, node)
    }
  }
  ts.forEachChild(sourceFile, typeNameMapBuilder)
  const visitor = (node: ts.Node) => {
    if (
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isEnumDeclaration(node)
    ) {
      const jsDoc = getJsDoc(node, sourceFile)
      const tags = getSimplifiedJsDocTags(jsDoc)
      if (!jsDocTagFilter(tags)) {
        return
      }
      if (!nameFilter(node.name.text)) {
        return
      }

      const typeNames = getExtractedTypeNames(node, sourceFile, typeNameMapping)
      typeNames.forEach((typeName) => {
        typesNeedToBeExtracted.add(typeName)
      })
    }
  }
  ts.forEachChild(sourceFile, visitor)

  typesNeedToBeExtracted.forEach((typeName) => {
    const node = typeNameMapping.get(typeName)
    if (node) {
      nodes.push(node)
    }
  })

  // Generate effect schemas
  const effectSchemas = nodes.map((node) => {
    const typeName = node.name.text
    const varName = getSchemaName(typeName)
    const effectSchema = generateSchemaVariableStatement({
      schemaImportValue: 'S',
      node,
      sourceFile,
      varName,
      getDependencyName: getSchemaName,
      skipParseJSDoc,
    })

    return { typeName, varName, ...effectSchema }
  })

  const effectSchemaNames = effectSchemas.map(({ varName }) => varName)

  // Effect schemas with direct or indirect dependencies that are not in `effectSchemas`, won't be generated
  const effectSchemasWithMissingDependencies = new Set<string>()
  const standardBuiltInObjects = new Set<string>()
  effectSchemas.forEach(({ varName, dependencies }) => {
    dependencies
      .filter((dep) => !effectSchemaNames.includes(dep))
      .forEach((dep) => {
        if (standardBuiltInObjectVarNames.includes(dep)) {
          standardBuiltInObjects.add(dep)
        } else {
          effectSchemasWithMissingDependencies.add(dep)
          effectSchemasWithMissingDependencies.add(varName)
        }
      })
  })
  effectSchemaNames.push(...standardBuiltInObjects)

  effectSchemas.push(
    ...Array.from(standardBuiltInObjects).map((obj) => {
      const typeName = obj[0].toUpperCase() + obj.substring(1, obj.length - 6)
      return {
        typeName,
        varName: obj,
        ...generateSchemaVariableStatement({
          typeName,
          schemaImportValue: 'S',
          sourceFile,
          varName: obj,
          getDependencyName: getSchemaName,
          skipParseJSDoc,
        }),
      }
    }),
  )

  // Resolves statements order
  // A schema can't be declared if all the referenced schemas used inside this one are not previously declared.
  const statements = new Map<
    string,
    { typeName: string; value: ts.VariableStatement }
  >()
  const typeImports: Set<string> = new Set()

  let done = false
  // Loop until no more schemas can be generated and no more schemas with direct or indirect missing dependencies are found
  while (
    !done &&
    statements.size + effectSchemasWithMissingDependencies.size !==
      effectSchemas.length
  ) {
    done = true
    effectSchemas
      .filter(
        ({ varName }) =>
          !statements.has(varName) &&
          !effectSchemasWithMissingDependencies.has(varName),
      )
      .forEach(
        ({ varName, dependencies, statement, typeName, requiresImport }) => {
          const isCircular = dependencies.includes(varName)
          const notGeneratedDependencies = dependencies
            .filter((dep) => dep !== varName)
            .filter((dep) => !statements.has(dep))
          if (notGeneratedDependencies.length === 0) {
            done = false
            if (isCircular) {
              getSchemaNameFun('lazy')
              typeImports.add(typeName)
              statements.set(varName, {
                value: transformRecursiveSchema('S', statement, typeName),
                typeName,
              })
            } else {
              if (requiresImport) {
                typeImports.add(typeName)
              }
              statements.set(varName, { value: statement, typeName })
            }
          } else if (
            // Check if every dependency is (in `effectSchemas` and not in `effectSchemasWithMissingDependencies`)
            !notGeneratedDependencies.every(
              (dep) =>
                effectSchemaNames.includes(dep) &&
                !effectSchemasWithMissingDependencies.has(dep),
            )
          ) {
            done = false
            effectSchemasWithMissingDependencies.add(varName)
          }
        },
      )
  }

  // Generate remaining schemas, which have circular dependencies with loop of length > 1 like: A->B—>C->A
  effectSchemas
    .filter(({ varName, statement }) => {
      getSchemaNameFun(statement)
      return (
        !statements.has(varName) &&
        !effectSchemasWithMissingDependencies.has(varName)
      )
    })
    .forEach(({ varName, statement, typeName }) => {
      typeImports.add(typeName)
      getSchemaNameFun('lazy')
      statements.set(varName, {
        value: transformRecursiveSchema('S', statement, typeName),
        typeName,
      })
    })

  // Warn the user of possible not resolvable loops
  const errors: string[] = []

  if (effectSchemasWithMissingDependencies.size > 0) {
    errors.push(
      `Some schemas can't be generated due to direct or indirect missing dependencies:
${Array.from(effectSchemasWithMissingDependencies).join('\n')}`,
    )
  }

  // Create output files (effect schemas & integration tests)
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: !keepComments,
  })

  const printerWithComments = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
  })

  const print = (node: ts.Node) =>
    printer.printNode(ts.EmitHint.Unspecified, node, sourceFile)

  const transformedSourceText = printerWithComments.printFile(sourceFile)

  const imports = Array.from(typeImports.values())
  const getEffectSchemasFile = (
    typesImportPath: string,
    sourceText: string,
  ) => {
    const typeImports = []
    const valueImports = []

    for (const type of imports) {
      if (new RegExp(`(type|interface) ${type}(?!w)`).test(sourceText)) {
        typeImports.push(type)
      } else {
        valueImports.push(type)
      }
    }
    const usedSchemaNames = getSchemaNameFun()

    return `// Generated by ts-to-effect-schema
import * as S from "@effect/schema/Schema";
${
  usedSchemaNames.includes('lazy')
    ? 'import type { ReadonlyDeep } from "type-fest";\n'
    : ''
}${
  usedSchemaNames.includes('pipe')
    ? 'import { pipe } from "@effect/data/Function";\n'
    : ''
}${
  typeImports.length
    ? `import type { ${typeImports.join(', ')} } from "${typesImportPath}";\n`
    : ''
}${
  valueImports.length
    ? `import { ${valueImports.join(', ')} } from "${typesImportPath}";\n`
    : ''
}
${Array.from(statements.values())
  .map((statement) => print(statement.value))
  .join('\n\n')}
`
  }

  const testCases = generateIntegrationTests(
    Array.from(statements.values())
      .filter(isExported)
      .map((i) => ({
        effectType: `${getSchemaName(i.typeName)}InferredType`,
        tsType: `spec.${i.typeName}`,
      })),
  )

  const getIntegrationTestFile = (
    typesImportPath: string,
    effectSchemasImportPath: string,
  ) => `// Generated by ts-to-effect-schema
  import * as S from "@effect/schema/Schema";
  import type { ReadonlyDeep } from "type-fest";

import * as spec from "${typesImportPath}";
import * as generated from "${effectSchemasImportPath}";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function expectType<T>(_: T) {
  /* noop */
}

${Array.from(statements.values())
  .filter(isExported)
  .map((statement) => {
    // Generate S.To<>
    const effectInferredSchema = generateSchemaInferredType({
      aliasName: `${getSchemaName(statement.typeName)}InferredType`,
      effectConstName: `generated.${getSchemaName(statement.typeName)}`,
      effectImportValue: 'S',
    })

    return print(effectInferredSchema)
  })
  .join('\n\n')}

${testCases.map(print).join('\n')}
`

  const getInferredTypes = (effectSchemasImportPath: string) => `// Generated by ts-to-effect-schema
import * as S from "@effect/schema/Schema";


import * as generated from "${effectSchemasImportPath}";

${Array.from(statements.values())
  .filter(isExported)
  .map((statement) => {
    const effectInferredSchema = generateSchemaInferredType({
      aliasName: statement.typeName,
      effectConstName: `generated.${getSchemaName(statement.typeName)}`,
      effectImportValue: 'S',
    })

    return print(effectInferredSchema)
  })
  .join('\n\n')}
`

  return {
    /**
     * Source text with pre-process applied.
     */
    transformedSourceText,

    /**
     * Get the content of the effect schemas file.
     *
     * @param typesImportPath Relative path of the source file
     */
    getEffectSchemasFile,

    /**
     * Get the content of the integration tests file.
     *
     * @param typesImportPath Relative path of the source file
     * @param effectSchemasImportPath Relative path of the effect schemas file
     */
    getIntegrationTestFile,

    /**
     * Get the content of the effect inferred types files.
     *
     * @param effectSchemasImportPath Relative path of the effect schemas file
     */
    getInferredTypes,

    /**
     * List of generation errors.
     */
    errors,

    /**
     * `true` if effectSchemaFile have some resolvable circular dependencies
     */
    hasCircularDependencies: imports.length > 0,
  }
}

/**
 * Helper to filter exported const declaration
 * @param i
 * @returns
 */
const isExported = (i: { typeName: string; value: ts.VariableStatement }) =>
  i.value.modifiers?.find((mod) => mod.kind === ts.SyntaxKind.ExportKeyword)

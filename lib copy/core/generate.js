"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = void 0;
const tslib_1 = require("tslib");
const case_1 = require("case");
const tsutils_1 = require("tsutils");
const typescript_1 = tslib_1.__importDefault(require("typescript"));
const getSimplifiedJsDocTags_1 = require("../utils/getSimplifiedJsDocTags");
const resolveModules_1 = require("../utils/resolveModules");
const traverseTypes_1 = require("../utils/traverseTypes");
const generateIntegrationTests_1 = require("./generateIntegrationTests");
const generateSchemaInferredType_1 = require("./generateSchemaInferredType");
const generateSchema_1 = require("./generateSchema");
const transformRecursiveSchema_1 = require("./transformRecursiveSchema");
const const_1 = require("./const");
const getSchemaNameList = (nameList = []) => (statement) => {
    if (!statement) {
        return nameList;
    }
    if (typeof statement === 'string') {
        if (!nameList.includes(statement)) {
            nameList.push(statement);
        }
        return nameList;
    }
    const getEscapedTextFun = (data) => {
        for (const [key, item] of Object.entries(data)) {
            if (!item ||
                typeof item !== 'object' ||
                ['modifiers', 'emitNode'].includes(key)) {
                continue;
            }
            const escapedText = item
                .escapedText;
            if (escapedText && !nameList.includes(escapedText)) {
                nameList.push(escapedText);
            }
            if (Array.isArray(item)) {
                item.forEach(getEscapedTextFun);
                continue;
            }
            getEscapedTextFun(item);
        }
    };
    getEscapedTextFun(statement);
    return nameList;
};
/**
 * Generate effect schemas and integration tests from a typescript file.
 *
 * This function take care of the sorting of the `const` declarations and solved potential circular references
 */
function generate({ sourceText, nameFilter = () => true, jsDocTagFilter = () => true, getSchemaName = (id) => `${(0, case_1.camel)(id)}Schema`, keepComments = false, skipParseJSDoc = false, }) {
    // Create a source file and deal with modules
    const sourceFile = (0, resolveModules_1.resolveModules)(sourceText);
    // Extract the nodes (interface declarations & type aliases)
    const nodes = [];
    // The schema name used
    const getSchemaNameFun = getSchemaNameList();
    // declare a map to store the interface name and its corresponding effect schema
    const typeNameMapping = new Map();
    const typesNeedToBeExtracted = new Set();
    const typeNameMapBuilder = (node) => {
        if ((0, traverseTypes_1.isTypeNode)(node)) {
            typeNameMapping.set(node.name.text, node);
        }
    };
    typescript_1.default.forEachChild(sourceFile, typeNameMapBuilder);
    const visitor = (node) => {
        if (typescript_1.default.isInterfaceDeclaration(node) ||
            typescript_1.default.isTypeAliasDeclaration(node) ||
            typescript_1.default.isEnumDeclaration(node)) {
            const jsDoc = (0, tsutils_1.getJsDoc)(node, sourceFile);
            const tags = (0, getSimplifiedJsDocTags_1.getSimplifiedJsDocTags)(jsDoc);
            if (!jsDocTagFilter(tags)) {
                return;
            }
            if (!nameFilter(node.name.text)) {
                return;
            }
            const typeNames = (0, traverseTypes_1.getExtractedTypeNames)(node, sourceFile, typeNameMapping);
            typeNames.forEach((typeName) => {
                typesNeedToBeExtracted.add(typeName);
            });
        }
    };
    typescript_1.default.forEachChild(sourceFile, visitor);
    typesNeedToBeExtracted.forEach((typeName) => {
        const node = typeNameMapping.get(typeName);
        if (node) {
            nodes.push(node);
        }
    });
    // Generate effect schemas
    const effectSchemas = nodes.map((node) => {
        const typeName = node.name.text;
        const varName = getSchemaName(typeName);
        const effectSchema = (0, generateSchema_1.generateSchemaVariableStatement)({
            schemaImportValue: 'S',
            node,
            sourceFile,
            varName,
            getDependencyName: getSchemaName,
            skipParseJSDoc,
        });
        return Object.assign({ typeName, varName }, effectSchema);
    });
    const effectSchemaNames = effectSchemas.map(({ varName }) => varName);
    // Effect schemas with direct or indirect dependencies that are not in `effectSchemas`, won't be generated
    const effectSchemasWithMissingDependencies = new Set();
    const standardBuiltInObjects = new Set();
    effectSchemas.forEach(({ varName, dependencies }) => {
        dependencies
            .filter((dep) => !effectSchemaNames.includes(dep))
            .forEach((dep) => {
            if (const_1.standardBuiltInObjectVarNames.includes(dep)) {
                standardBuiltInObjects.add(dep);
            }
            else {
                effectSchemasWithMissingDependencies.add(dep);
                effectSchemasWithMissingDependencies.add(varName);
            }
        });
    });
    effectSchemaNames.push(...standardBuiltInObjects);
    effectSchemas.push(...Array.from(standardBuiltInObjects).map((obj) => {
        const typeName = obj[0].toUpperCase() + obj.substring(1, obj.length - 6);
        return Object.assign({ typeName, varName: obj }, (0, generateSchema_1.generateSchemaVariableStatement)({
            typeName,
            schemaImportValue: 'S',
            sourceFile,
            varName: obj,
            getDependencyName: getSchemaName,
            skipParseJSDoc,
        }));
    }));
    // Resolves statements order
    // A schema can't be declared if all the referenced schemas used inside this one are not previously declared.
    const statements = new Map();
    const typeImports = new Set();
    let done = false;
    // Loop until no more schemas can be generated and no more schemas with direct or indirect missing dependencies are found
    while (!done &&
        statements.size + effectSchemasWithMissingDependencies.size !==
            effectSchemas.length) {
        done = true;
        effectSchemas
            .filter(({ varName }) => !statements.has(varName) &&
            !effectSchemasWithMissingDependencies.has(varName))
            .forEach(({ varName, dependencies, statement, typeName, requiresImport }) => {
            const isCircular = dependencies.includes(varName);
            const notGeneratedDependencies = dependencies
                .filter((dep) => dep !== varName)
                .filter((dep) => !statements.has(dep));
            if (notGeneratedDependencies.length === 0) {
                done = false;
                if (isCircular) {
                    getSchemaNameFun('lazy');
                    typeImports.add(typeName);
                    statements.set(varName, {
                        value: (0, transformRecursiveSchema_1.transformRecursiveSchema)('S', statement, typeName),
                        typeName,
                    });
                }
                else {
                    if (requiresImport) {
                        typeImports.add(typeName);
                    }
                    statements.set(varName, { value: statement, typeName });
                }
            }
            else if (
            // Check if every dependency is (in `effectSchemas` and not in `effectSchemasWithMissingDependencies`)
            !notGeneratedDependencies.every((dep) => effectSchemaNames.includes(dep) &&
                !effectSchemasWithMissingDependencies.has(dep))) {
                done = false;
                effectSchemasWithMissingDependencies.add(varName);
            }
        });
    }
    // Generate remaining schemas, which have circular dependencies with loop of length > 1 like: A->B—>C->A
    effectSchemas
        .filter(({ varName, statement }) => {
        getSchemaNameFun(statement);
        return (!statements.has(varName) &&
            !effectSchemasWithMissingDependencies.has(varName));
    })
        .forEach(({ varName, statement, typeName }) => {
        typeImports.add(typeName);
        getSchemaNameFun('lazy');
        statements.set(varName, {
            value: (0, transformRecursiveSchema_1.transformRecursiveSchema)('S', statement, typeName),
            typeName,
        });
    });
    // Warn the user of possible not resolvable loops
    const errors = [];
    if (effectSchemasWithMissingDependencies.size > 0) {
        errors.push(`Some schemas can't be generated due to direct or indirect missing dependencies:
${Array.from(effectSchemasWithMissingDependencies).join('\n')}`);
    }
    // Create output files (effect schemas & integration tests)
    const printer = typescript_1.default.createPrinter({
        newLine: typescript_1.default.NewLineKind.LineFeed,
        removeComments: !keepComments,
    });
    const printerWithComments = typescript_1.default.createPrinter({
        newLine: typescript_1.default.NewLineKind.LineFeed,
    });
    const print = (node) => printer.printNode(typescript_1.default.EmitHint.Unspecified, node, sourceFile);
    const transformedSourceText = printerWithComments.printFile(sourceFile);
    const imports = Array.from(typeImports.values());
    const getEffectSchemasFile = (typesImportPath, sourceText) => {
        const typeImports = [];
        const valueImports = [];
        for (const type of imports) {
            if (new RegExp(`(type|interface) ${type}(?!w)`).test(sourceText)) {
                typeImports.push(type);
            }
            else {
                valueImports.push(type);
            }
        }
        const usedSchemaNames = getSchemaNameFun();
        return `// Generated by ts-to-effect-schema
import * as S from "@effect/schema/Schema";
${usedSchemaNames.includes('lazy')
            ? 'import type { ReadonlyDeep } from "type-fest";\n'
            : ''}${usedSchemaNames.includes('pipe')
            ? 'import { pipe } from "@effect/data/Function";\n'
            : ''}${typeImports.length
            ? `import type { ${typeImports.join(', ')} } from "${typesImportPath}";\n`
            : ''}${valueImports.length
            ? `import { ${valueImports.join(', ')} } from "${typesImportPath}";\n`
            : ''}
${Array.from(statements.values())
            .map((statement) => print(statement.value))
            .join('\n\n')}
`;
    };
    const testCases = (0, generateIntegrationTests_1.generateIntegrationTests)(Array.from(statements.values())
        .filter(isExported)
        .map((i) => ({
        effectType: `${getSchemaName(i.typeName)}InferredType`,
        tsType: `spec.${i.typeName}`,
    })));
    const getIntegrationTestFile = (typesImportPath, effectSchemasImportPath) => `// Generated by ts-to-effect-schema
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
        const effectInferredSchema = (0, generateSchemaInferredType_1.generateSchemaInferredType)({
            aliasName: `${getSchemaName(statement.typeName)}InferredType`,
            effectConstName: `generated.${getSchemaName(statement.typeName)}`,
            effectImportValue: 'S',
        });
        return print(effectInferredSchema);
    })
        .join('\n\n')}

${testCases.map(print).join('\n')}
`;
    const getInferredTypes = (effectSchemasImportPath) => `// Generated by ts-to-effect-schema
import * as S from "@effect/schema/Schema";


import * as generated from "${effectSchemasImportPath}";

${Array.from(statements.values())
        .filter(isExported)
        .map((statement) => {
        const effectInferredSchema = (0, generateSchemaInferredType_1.generateSchemaInferredType)({
            aliasName: statement.typeName,
            effectConstName: `generated.${getSchemaName(statement.typeName)}`,
            effectImportValue: 'S',
        });
        return print(effectInferredSchema);
    })
        .join('\n\n')}
`;
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
    };
}
exports.generate = generate;
/**
 * Helper to filter exported const declaration
 * @param i
 * @returns
 */
const isExported = (i) => { var _a; return (_a = i.value.modifiers) === null || _a === void 0 ? void 0 : _a.find((mod) => mod.kind === typescript_1.default.SyntaxKind.ExportKeyword); };
//# sourceMappingURL=generate.js.map
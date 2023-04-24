"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveModules = void 0;
const tslib_1 = require("tslib");
const case_1 = require("case");
const typescript_1 = tslib_1.__importStar(require("typescript"));
/**
 * Resolve all modules from a source text.
 *
 * @param sourceText
 */
function resolveModules(sourceText) {
    const sourceFile = typescript_1.default.createSourceFile('index.ts', sourceText, typescript_1.default.ScriptTarget.Latest);
    const declarations = getDeclarationNames(sourceFile);
    const { transformed } = typescript_1.default.transform(sourceFile, [
        moduleToPrefix(declarations),
    ]);
    return parseSourceFile(transformed[0]);
}
exports.resolveModules = resolveModules;
/**
 * Parse a sourceFile in order to have new node positions.
 *
 * Typescript need all the node positions to be able to manipulate the AST.
 * After any transformation, an altered node will have `{pos: -1, end: -1}`, this
 * will cause issue when trying to get the JSDocTags (as example)
 *
 * @param sourceFile
 */
function parseSourceFile(sourceFile) {
    const printer = typescript_1.default.createPrinter({
        newLine: typescript_1.default.NewLineKind.LineFeed,
        removeComments: false,
    });
    const print = (node) => printer.printNode(typescript_1.default.EmitHint.Unspecified, node, sourceFile);
    const sourceText = print(sourceFile);
    return typescript_1.default.createSourceFile('index.ts', sourceText, typescript_1.default.ScriptTarget.Latest);
}
/**
 * Extract all declarations under a namespace
 *
 * @param sourceFile
 * @returns
 */
function getDeclarationNames(sourceFile) {
    const declarations = new Map();
    const extractNamespacedTypesVisitor = (namespace) => (node) => {
        if (typescript_1.default.isInterfaceDeclaration(node) ||
            typescript_1.default.isTypeAliasDeclaration(node) ||
            typescript_1.default.isEnumDeclaration(node)) {
            const prev = declarations.get(namespace);
            prev
                ? declarations.set(namespace, [...prev, node.name.text])
                : declarations.set(namespace, [node.name.text]);
        }
    };
    const topLevelVisitor = (node) => {
        var _a;
        if (typescript_1.default.isModuleDeclaration(node)) {
            (_a = node.body) === null || _a === void 0 ? void 0 : _a.forEachChild(extractNamespacedTypesVisitor(node.name.text));
        }
    };
    sourceFile.forEachChild(topLevelVisitor);
    return declarations;
}
/**
 * Apply namespace to every declarations
 *
 * @param declarationNames
 * @returns
 */
const moduleToPrefix = (declarationNames) => (context) => (sourceFile) => {
    const prefixInterfacesAndTypes = (moduleName) => (node) => {
        if (typescript_1.default.isTypeReferenceNode(node) &&
            typescript_1.default.isIdentifier(node.typeName) &&
            (declarationNames.get(moduleName) || []).includes(node.typeName.text)) {
            return typescript_1.factory.updateTypeReferenceNode(node, typescript_1.factory.createIdentifier((0, case_1.pascal)(moduleName) + (0, case_1.pascal)(node.typeName.text)), node.typeArguments);
        }
        if (typescript_1.default.isTypeAliasDeclaration(node)) {
            return typescript_1.factory.updateTypeAliasDeclaration(node, 
            // node.decorators,
            node.modifiers, typescript_1.factory.createIdentifier((0, case_1.pascal)(moduleName) + (0, case_1.pascal)(node.name.text)), node.typeParameters, typescript_1.default.isTypeLiteralNode(node.type)
                ? typescript_1.factory.updateTypeLiteralNode(node.type, typescript_1.default.visitNodes(node.type.members, prefixInterfacesAndTypes(moduleName), typescript_1.default.isTypeElement))
                : typescript_1.default.isTypeReferenceNode(node.type)
                    ? typescript_1.factory.updateTypeReferenceNode(node.type, node.type.typeName, typescript_1.default.visitNodes(node.type.typeArguments, prefixInterfacesAndTypes(moduleName), typescript_1.default.isTypeNode))
                    : node.type);
        }
        if (typescript_1.default.isInterfaceDeclaration(node)) {
            return typescript_1.factory.updateInterfaceDeclaration(node, 
            // node.decorators,
            node.modifiers, typescript_1.factory.createIdentifier((0, case_1.pascal)(moduleName) + (0, case_1.pascal)(node.name.text)), node.typeParameters, typescript_1.default.visitNodes(node.heritageClauses, prefixInterfacesAndTypes(moduleName), typescript_1.default.isHeritageClause), typescript_1.default.visitNodes(node.members, prefixInterfacesAndTypes(moduleName), typescript_1.default.isTypeElement));
        }
        if (typescript_1.default.isHeritageClause(node)) {
            return typescript_1.factory.updateHeritageClause(node, typescript_1.default.visitNodes(node.types, prefixInterfacesAndTypes(moduleName), typescript_1.default.isExpressionWithTypeArguments));
        }
        if (typescript_1.default.isExpressionWithTypeArguments(node) &&
            typescript_1.default.isIdentifier(node.expression) &&
            (declarationNames.get(moduleName) || []).includes(node.expression.text)) {
            return typescript_1.factory.updateExpressionWithTypeArguments(node, typescript_1.factory.createIdentifier((0, case_1.pascal)(moduleName) + (0, case_1.pascal)(node.expression.text)), node.typeArguments);
        }
        if (typescript_1.default.isEnumDeclaration(node)) {
            return typescript_1.factory.updateEnumDeclaration(node, 
            // node.decorators,
            node.modifiers, typescript_1.factory.createIdentifier((0, case_1.pascal)(moduleName) + (0, case_1.pascal)(node.name.text)), node.members);
        }
        return typescript_1.default.visitEachChild(node, prefixInterfacesAndTypes(moduleName), context);
    };
    const flattenModuleDeclaration = (node) => {
        if (typescript_1.default.isModuleDeclaration(node) &&
            node.body &&
            typescript_1.default.isModuleBlock(node.body)) {
            const transformedNodes = typescript_1.default.visitNodes(node.body.statements, prefixInterfacesAndTypes(node.name.text));
            return [...transformedNodes];
        }
        return typescript_1.default.visitEachChild(node, flattenModuleDeclaration, context);
    };
    return typescript_1.default.visitNode(sourceFile, flattenModuleDeclaration, typescript_1.default.isSourceFile);
};
//# sourceMappingURL=resolveModules.js.map
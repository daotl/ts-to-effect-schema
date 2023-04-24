"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDefaultProperties = void 0;
const tslib_1 = require("tslib");
const typescript_1 = tslib_1.__importDefault(require("typescript"));
const jsDocTags_1 = require("../core/jsDocTags");
/**
 * Remove optional properties when `@default` jsdoc tag is defined.
 *
 * Indeed, `S.optional(S.{type}).withDefault({value})` will be
 * compile as a non-optional type.
 */
function resolveDefaultProperties(sourceText) {
    const sourceFile = typescript_1.default.createSourceFile('index.ts', sourceText, typescript_1.default.ScriptTarget.Latest);
    const printer = typescript_1.default.createPrinter({ newLine: typescript_1.default.NewLineKind.LineFeed });
    const removeOptionalTransformer = (context) => {
        const visit = (node) => {
            node = typescript_1.default.visitEachChild(node, visit, context);
            if (typescript_1.default.isPropertySignature(node)) {
                const jsDocTags = (0, jsDocTags_1.getJSDocTags)(node, sourceFile);
                if (jsDocTags.default !== undefined) {
                    const type = node.type
                        ? typescript_1.default.visitEachChild(node.type, omitUndefinedKeyword, context)
                        : undefined;
                    return typescript_1.default.factory.createPropertySignature(node.modifiers, node.name, undefined, // Remove `questionToken`
                    type);
                }
            }
            return node;
        };
        return (node) => typescript_1.default.visitNode(node, visit, typescript_1.default.isSourceFile);
    };
    const outputFile = typescript_1.default.transform(sourceFile, [removeOptionalTransformer]);
    return printer.printFile(outputFile.transformed[0]);
}
exports.resolveDefaultProperties = resolveDefaultProperties;
function omitUndefinedKeyword(node) {
    if (node.kind === typescript_1.default.SyntaxKind.UndefinedKeyword) {
        return undefined;
    }
    return node;
}
//# sourceMappingURL=resolveDefaultProperties.js.map
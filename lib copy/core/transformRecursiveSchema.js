"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformRecursiveSchema = void 0;
const tslib_1 = require("tslib");
const typescript_1 = tslib_1.__importDefault(require("typescript"));
const { factory: f } = typescript_1.default;
/**
 * Type hint effect to deal with recursive types.
 *
 * https://github.com/colinhacks/effect/tree/v3#recursive-types
 */
function transformRecursiveSchema(effectImportValue, effectStatement, typeName) {
    const declaration = effectStatement.declarationList.declarations[0];
    if (!declaration.initializer) {
        throw new Error('Unvalid effect statement');
    }
    return f.createVariableStatement(effectStatement.modifiers, f.createVariableDeclarationList([
        f.createVariableDeclaration(declaration.name, undefined, f.createTypeReferenceNode(`${effectImportValue}.Schema`, [
            f.createTypeReferenceNode('ReadonlyDeep', [
                f.createTypeReferenceNode(typeName),
            ]),
        ]), f.createCallExpression(f.createPropertyAccessExpression(f.createIdentifier(effectImportValue), f.createIdentifier('lazy')), undefined, [
            f.createArrowFunction(undefined, undefined, [], undefined, undefined, declaration.initializer),
        ])),
    ], typescript_1.default.NodeFlags.Const));
}
exports.transformRecursiveSchema = transformRecursiveSchema;
//# sourceMappingURL=transformRecursiveSchema.js.map
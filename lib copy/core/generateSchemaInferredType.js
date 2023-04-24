"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSchemaInferredType = void 0;
const tslib_1 = require("tslib");
const ts = tslib_1.__importStar(require("typescript"));
const { factory: f } = ts;
/**
 * Generate effect inferred type.
 *
 * ```ts
 *  export type ${aliasName} = ${effectImportValue}.infer<typeof ${effectConstName}>
 * ```
 */
function generateSchemaInferredType({ aliasName, effectImportValue, effectConstName, }) {
    return f.createTypeAliasDeclaration([f.createModifier(ts.SyntaxKind.ExportKeyword)], f.createIdentifier(aliasName), undefined, f.createTypeReferenceNode(f.createQualifiedName(f.createIdentifier(effectImportValue), f.createIdentifier('To')), [f.createTypeQueryNode(f.createIdentifier(effectConstName))]));
}
exports.generateSchemaInferredType = generateSchemaInferredType;
//# sourceMappingURL=generateSchemaInferredType.js.map
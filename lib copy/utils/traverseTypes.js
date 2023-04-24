"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExtractedTypeNames = exports.isTypeNode = void 0;
const tslib_1 = require("tslib");
const typescript_1 = tslib_1.__importDefault(require("typescript"));
function isTypeNode(node) {
    return (typescript_1.default.isInterfaceDeclaration(node) ||
        typescript_1.default.isTypeAliasDeclaration(node) ||
        typescript_1.default.isEnumDeclaration(node));
}
exports.isTypeNode = isTypeNode;
function getExtractedTypeNames(node, sourceFile, typeNameMapping) {
    const referenceTypeNames = [];
    const recursiveExtract = (node) => {
        if (node.visited) {
            return;
        }
        const heritageClauses = node.heritageClauses;
        if (heritageClauses) {
            heritageClauses.forEach((clause) => {
                const extensionTypes = clause.types;
                extensionTypes.forEach((extensionTypeNode) => {
                    const typeName = extensionTypeNode.expression.getText(sourceFile);
                    const typeNode = typeNameMapping.get(typeName);
                    referenceTypeNames.push(typeName);
                    if (typeNode) {
                        typeNode.visited = true;
                        recursiveExtract(typeNode);
                    }
                });
            });
        }
        node.forEachChild((child) => {
            var _a;
            const childNode = child;
            if (childNode.kind !== typescript_1.default.SyntaxKind.PropertySignature) {
                return;
            }
            if (((_a = childNode.type) === null || _a === void 0 ? void 0 : _a.kind) === typescript_1.default.SyntaxKind.TypeReference) {
                const typeNode = typeNameMapping.get(childNode.type.getText(sourceFile));
                referenceTypeNames.push(childNode.type.getText(sourceFile));
                if (typeNode) {
                    typeNode.visited = true;
                    recursiveExtract(typeNode);
                }
            }
        });
    };
    recursiveExtract(node);
    return [node.name.text, ...referenceTypeNames];
}
exports.getExtractedTypeNames = getExtractedTypeNames;
//# sourceMappingURL=traverseTypes.js.map
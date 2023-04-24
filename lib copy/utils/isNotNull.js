"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNotNull = void 0;
const tslib_1 = require("tslib");
const typescript_1 = tslib_1.__importDefault(require("typescript"));
/**
 * Helper to filter out any `null` node
 *
 * @param node
 * @returns
 */
function isNotNull(node) {
    return (!typescript_1.default.isLiteralTypeNode(node) ||
        node.literal.kind !== typescript_1.default.SyntaxKind.NullKeyword);
}
exports.isNotNull = isNotNull;
//# sourceMappingURL=isNotNull.js.map
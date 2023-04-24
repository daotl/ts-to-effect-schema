"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callPipe = exports.callCreateCallExpression = exports.callCreatePropertyAccessExpression = void 0;
const tslib_1 = require("tslib");
const ts = tslib_1.__importStar(require("typescript"));
const { factory: f } = ts;
const callCreatePropertyAccessExpression = (S, identifier) => f.createPropertyAccessExpression(typeof S === 'string' ? f.createIdentifier(S) : S, typeof identifier === 'string'
    ? f.createIdentifier(identifier)
    : identifier);
exports.callCreatePropertyAccessExpression = callCreatePropertyAccessExpression;
const callCreateCallExpression = (S, identifier, typeArguments, argumentsArray) => f.createCallExpression((0, exports.callCreatePropertyAccessExpression)(S, identifier), typeArguments, argumentsArray);
exports.callCreateCallExpression = callCreateCallExpression;
const callPipe = (typeArguments, argumentsArray) => f.createCallExpression(f.createIdentifier('pipe'), typeArguments, argumentsArray);
exports.callPipe = callPipe;
//# sourceMappingURL=commonSchema.js.map
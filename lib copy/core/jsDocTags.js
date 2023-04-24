"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsDocTagToEffectSchemaProperties = exports.getJSDocTags = void 0;
const tslib_1 = require("tslib");
const typescript_1 = tslib_1.__importDefault(require("typescript"));
const tsutils_1 = require("tsutils");
const { factory: f } = typescript_1.default;
/**
 * List of formats that can be translated in effect schema functions.
 */
const formats = [
    'email',
    'uuid',
    // "uri" as const,
    'url',
    // "date" as const,
    // "date-time" as const,
];
/**
 * Typeguard to filter supported JSDoc tag key.
 *
 * @param tagName
 */
function isJSDocTagKey(tagName) {
    const keys = [
        'minimum',
        'maximum',
        'default',
        'minLength',
        'maxLength',
        'format',
        'pattern',
    ];
    return keys.includes(tagName);
}
/**
 * Typeguard to filter supported JSDoc format tag values.
 *
 * @param format
 */
function isSupportedFormat(format = '') {
    return formats.includes(format);
}
/**
 * Parse js doc comment.
 *
 * @example
 * parseJsDocComment("email should be an email");
 * // {value: "email", errorMessage: "should be an email"}
 *
 * @param comment
 */
function parseJsDocComment(comment) {
    const [value, ...rest] = comment.split(' ');
    const errorMessage = rest.join(' ').replace(/(^["']|["']$)/g, '') || undefined;
    return {
        value: value.replace(',', '').replace(/(^["']|["']$)/g, ''),
        errorMessage,
    };
}
/**
 * Return parsed JSTags.
 *
 * @param nodeType
 * @param sourceFile
 * @returns Tags list
 */
function getJSDocTags(nodeType, sourceFile) {
    const jsDoc = (0, tsutils_1.getJsDoc)(nodeType, sourceFile);
    const jsDocTags = {};
    if (jsDoc.length) {
        jsDoc.forEach((doc) => {
            ;
            (doc.tags || []).forEach((tag) => {
                var _a;
                const tagName = tag.tagName.escapedText.toString();
                if (!isJSDocTagKey(tagName) || typeof tag.comment !== 'string') {
                    return;
                }
                const { value, errorMessage } = parseJsDocComment(tag.comment);
                switch (tagName) {
                    case 'minimum':
                    case 'maximum':
                    case 'minLength':
                    case 'maxLength':
                        if (value && !Number.isNaN(parseInt(value))) {
                            jsDocTags[tagName] = { value: parseInt(value), errorMessage };
                        }
                        break;
                    case 'pattern':
                        if (tag.comment) {
                            jsDocTags[tagName] = tag.comment;
                        }
                        break;
                    case 'format':
                        if (isSupportedFormat(value)) {
                            jsDocTags[tagName] = { value, errorMessage };
                        }
                        break;
                    case 'default':
                        if (tag.comment &&
                            !tag.comment.includes('"') &&
                            !Number.isNaN(parseInt(tag.comment))) {
                            // number
                            jsDocTags[tagName] = parseInt(tag.comment);
                        }
                        else if (tag.comment && ['false', 'true'].includes(tag.comment)) {
                            // boolean
                            jsDocTags[tagName] = tag.comment === 'true';
                        }
                        else if (((_a = tag.comment) === null || _a === void 0 ? void 0 : _a.startsWith('"')) &&
                            tag.comment.endsWith('"')) {
                            // string with double quotes
                            jsDocTags[tagName] = tag.comment.slice(1, -1);
                        }
                        else if (tag.comment) {
                            // string without quotes
                            jsDocTags[tagName] = tag.comment;
                        }
                        break;
                }
            });
        });
    }
    return jsDocTags;
}
exports.getJSDocTags = getJSDocTags;
/**
 * Convert a set of jsDocTags to effect schema properties
 *
 * @param jsDocTags
 * @param isOptional
 * @param isPartial
 * @param isRequired
 * @param isNullable
 */
function jsDocTagToEffectSchemaProperties(jsDocTags, isOptional, isPartial, isRequired, isNullable) {
    const effectSchemaProperties = [];
    if (jsDocTags.minimum !== undefined) {
        effectSchemaProperties.push({
            identifier: 'lessThan',
            expressions: withErrorMessage(f.createNumericLiteral(jsDocTags.minimum.value), jsDocTags.minimum.errorMessage),
        });
    }
    if (jsDocTags.maximum !== undefined) {
        effectSchemaProperties.push({
            identifier: 'greaterThan',
            expressions: withErrorMessage(f.createNumericLiteral(jsDocTags.maximum.value), jsDocTags.maximum.errorMessage),
        });
    }
    if (jsDocTags.minLength !== undefined) {
        effectSchemaProperties.push({
            identifier: 'minLength',
            expressions: withErrorMessage(f.createNumericLiteral(jsDocTags.minLength.value), jsDocTags.minLength.errorMessage),
        });
    }
    if (jsDocTags.maxLength !== undefined) {
        effectSchemaProperties.push({
            identifier: 'maxLength',
            expressions: withErrorMessage(f.createNumericLiteral(jsDocTags.maxLength.value), jsDocTags.maxLength.errorMessage),
        });
    }
    if (jsDocTags.format) {
        effectSchemaProperties.push({
            identifier: jsDocTags.format.value,
            expressions: jsDocTags.format.errorMessage
                ? [f.createStringLiteral(jsDocTags.format.errorMessage)]
                : undefined,
        });
    }
    if (jsDocTags.pattern) {
        effectSchemaProperties.push({
            identifier: 'pattern',
            expressions: [f.createRegularExpressionLiteral(`/${jsDocTags.pattern}/`)],
        });
    }
    if (isOptional) {
        effectSchemaProperties.push({
            identifier: 'optional',
        });
    }
    if (isNullable) {
        effectSchemaProperties.push({
            identifier: 'nullable',
        });
    }
    if (isPartial) {
        effectSchemaProperties.push({
            identifier: 'partial',
        });
    }
    if (isRequired) {
        effectSchemaProperties.push({
            identifier: 'required',
        });
    }
    if (jsDocTags.default !== undefined) {
        effectSchemaProperties.push({
            identifier: 'optional.withDefault',
            expressions: [
                f.createCallExpression(f.createIdentifier('withDefault'), undefined, [
                    f.createIdentifier(`() => ${typeof jsDocTags.default === 'string'
                        ? `'${jsDocTags.default}'`
                        : jsDocTags.default}`),
                ]),
            ],
        });
    }
    return effectSchemaProperties;
}
exports.jsDocTagToEffectSchemaProperties = jsDocTagToEffectSchemaProperties;
function withErrorMessage(expression, errorMessage) {
    if (errorMessage) {
        return [expression, f.createStringLiteral(errorMessage)];
    }
    return [expression];
}
//# sourceMappingURL=jsDocTags.js.map
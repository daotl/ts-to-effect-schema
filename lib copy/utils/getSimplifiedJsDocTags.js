"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSimplifiedJsDocTags = void 0;
/**
 * Get a simplified version of a node JSDocTags.
 *
 * @param jsDocs
 */
function getSimplifiedJsDocTags(jsDocs) {
    const tags = [];
    jsDocs.forEach((jsDoc) => {
        ;
        (jsDoc.tags || []).forEach((tag) => {
            const name = tag.tagName.escapedText.toString();
            const value = typeof tag.comment === 'string' ? tag.comment : undefined;
            tags.push({ name, value });
        });
    });
    return tags;
}
exports.getSimplifiedJsDocTags = getSimplifiedJsDocTags;
//# sourceMappingURL=getSimplifiedJsDocTags.js.map
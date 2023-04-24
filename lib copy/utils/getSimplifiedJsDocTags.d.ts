import ts from 'typescript';
import { SimplifiedJSDocTag } from '../config';
/**
 * Get a simplified version of a node JSDocTags.
 *
 * @param jsDocs
 */
export declare function getSimplifiedJsDocTags(jsDocs: ts.JSDoc[]): SimplifiedJSDocTag[];

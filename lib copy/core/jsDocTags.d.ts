import ts from 'typescript';
/**
 * List of formats that can be translated in effect schema functions.
 */
declare const formats: ("url" | "email" | "uuid")[];
type TagWithError<T> = {
    value: T;
    errorMessage?: string;
};
/**
 * JSDoc special tags that can be converted in effect schema flags.
 */
export interface JSDocTags {
    minimum?: TagWithError<number>;
    maximum?: TagWithError<number>;
    default?: number | string | boolean;
    minLength?: TagWithError<number>;
    maxLength?: TagWithError<number>;
    format?: TagWithError<typeof formats[-1]>;
    pattern?: string;
}
/**
 * Return parsed JSTags.
 *
 * @param nodeType
 * @param sourceFile
 * @returns Tags list
 */
export declare function getJSDocTags(nodeType: ts.Node, sourceFile: ts.SourceFile): JSDocTags;
export type EffectSchemaProperty = {
    identifier: string;
    expressions?: ts.Expression[];
};
/**
 * Convert a set of jsDocTags to effect schema properties
 *
 * @param jsDocTags
 * @param isOptional
 * @param isPartial
 * @param isRequired
 * @param isNullable
 */
export declare function jsDocTagToEffectSchemaProperties(jsDocTags: JSDocTags, isOptional: boolean, isPartial: boolean, isRequired: boolean, isNullable: boolean): EffectSchemaProperty[];
export {};

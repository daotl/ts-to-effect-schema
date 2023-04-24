/**
 * Remove optional properties when `@default` jsdoc tag is defined.
 *
 * Indeed, `S.optional(S.{type}).withDefault({value})` will be
 * compile as a non-optional type.
 */
export declare function resolveDefaultProperties(sourceText: string): string;

import { JSDocTagFilter, NameFilter } from '../config';
export interface GenerateProps {
    /**
     * Content of the typescript source file.
     */
    sourceText: string;
    /**
     * Filter on type/interface name.
     */
    nameFilter?: NameFilter;
    /**
     * Filter on JSDocTag.
     */
    jsDocTagFilter?: JSDocTagFilter;
    /**
     * Schema name generator.
     */
    getSchemaName?: (identifier: string) => string;
    /**
     * Keep parameters comments.
     * @default false
     */
    keepComments?: boolean;
    /**
     * Skip the creation of effect validators from JSDoc annotations
     *
     * @default false
     */
    skipParseJSDoc?: boolean;
    /**
     * Path of S.To<> types file.
     */
    inferredTypes?: string;
}
/**
 * Generate effect schemas and integration tests from a typescript file.
 *
 * This function take care of the sorting of the `const` declarations and solved potential circular references
 */
export declare function generate({ sourceText, nameFilter, jsDocTagFilter, getSchemaName, keepComments, skipParseJSDoc, }: GenerateProps): {
    /**
     * Source text with pre-process applied.
     */
    transformedSourceText: string;
    /**
     * Get the content of the effect schemas file.
     *
     * @param typesImportPath Relative path of the source file
     */
    getEffectSchemasFile: (typesImportPath: string, sourceText: string) => string;
    /**
     * Get the content of the integration tests file.
     *
     * @param typesImportPath Relative path of the source file
     * @param effectSchemasImportPath Relative path of the effect schemas file
     */
    getIntegrationTestFile: (typesImportPath: string, effectSchemasImportPath: string) => string;
    /**
     * Get the content of the effect inferred types files.
     *
     * @param effectSchemasImportPath Relative path of the effect schemas file
     */
    getInferredTypes: (effectSchemasImportPath: string) => string;
    /**
     * List of generation errors.
     */
    errors: string[];
    /**
     * `true` if effectSchemaFile have some resolvable circular dependencies
     */
    hasCircularDependencies: boolean;
};

interface File {
    sourceText: string;
    relativePath: string;
}
export interface ValidateGeneratedTypesProps {
    sourceTypes: File;
    effectSchemas: File;
    integrationTests: File;
    skipParseJSDoc: boolean;
}
/**
 * Use typescript compiler to validate the generated effect schemas.
 */
export declare function validateGeneratedTypes({ sourceTypes, effectSchemas, integrationTests, skipParseJSDoc, }: ValidateGeneratedTypesProps): string[];
export {};

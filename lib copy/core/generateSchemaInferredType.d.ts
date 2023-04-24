import * as ts from 'typescript';
export interface GenerateEffectInferredTypeProps {
    aliasName: string;
    effectImportValue: string;
    effectConstName: string;
}
/**
 * Generate effect inferred type.
 *
 * ```ts
 *  export type ${aliasName} = ${effectImportValue}.infer<typeof ${effectConstName}>
 * ```
 */
export declare function generateSchemaInferredType({ aliasName, effectImportValue, effectConstName, }: GenerateEffectInferredTypeProps): ts.TypeAliasDeclaration;

import * as ts from 'typescript';
export interface GenerateEffectSchemaProps {
    /**
     * Name of the exported variable
     */
    varName: string;
    /**
     * Name of the standard built-in object
     */
    typeName?: string;
    /**
     * Interface or type node
     */
    node?: ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.EnumDeclaration;
    /**
     * effect schema import value.
     *
     * @default "S"
     */
    schemaImportValue?: string;
    /**
     * Source file
     */
    sourceFile: ts.SourceFile;
    /**
     * Getter for schema dependencies (Type reference inside type)
     *
     * @default (identifierName) => camel(`${identifierName}Schema`)
     */
    getDependencyName?: (identifierName: string) => string;
    /**
     * Skip the creation of effect schema validators from JSDoc annotations
     *
     * @default false
     */
    skipParseJSDoc?: boolean;
}
/**
 * Generate effect schema declaration
 *
 * ```ts
 * export const ${varName} = ${schemaImportValue}.object(…)
 * ```
 */
export declare function generateSchemaVariableStatement({ node, typeName, sourceFile, varName, schemaImportValue, getDependencyName, skipParseJSDoc, }: GenerateEffectSchemaProps): {
    dependencies: string[];
    statement: ts.VariableStatement;
    requiresImport: boolean;
};

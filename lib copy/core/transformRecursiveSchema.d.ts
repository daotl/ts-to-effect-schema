import ts from 'typescript';
/**
 * Type hint effect to deal with recursive types.
 *
 * https://github.com/colinhacks/effect/tree/v3#recursive-types
 */
export declare function transformRecursiveSchema(effectImportValue: string, effectStatement: ts.VariableStatement, typeName: string): ts.VariableStatement;

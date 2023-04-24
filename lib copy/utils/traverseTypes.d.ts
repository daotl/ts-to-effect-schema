import ts from 'typescript';
export type TypeNode = (ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.EnumDeclaration) & {
    visited?: boolean;
};
export declare function isTypeNode(node: ts.Node): node is TypeNode;
export declare function getExtractedTypeNames(node: TypeNode, sourceFile: ts.SourceFile, typeNameMapping: Map<string, TypeNode>): string[];

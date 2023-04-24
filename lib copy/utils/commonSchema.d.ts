import * as ts from 'typescript';
export declare const callCreatePropertyAccessExpression: (S: string | ts.Expression, identifier: string | ts.MemberName) => ts.PropertyAccessExpression;
export declare const callCreateCallExpression: (S: ts.Expression | string, identifier: ts.MemberName | string, typeArguments: readonly ts.TypeNode[] | undefined, argumentsArray: readonly ts.Expression[] | undefined) => ts.CallExpression;
export declare const callPipe: (typeArguments: readonly ts.TypeNode[] | undefined, argumentsArray: readonly ts.Expression[] | undefined) => ts.CallExpression;

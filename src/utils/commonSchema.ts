import * as ts from 'typescript'

const { factory: f } = ts

export const callCreatePropertyAccessExpression = (
  S: string | ts.Expression,
  identifier: string | ts.MemberName,
) =>
  f.createPropertyAccessExpression(
    typeof S === 'string' ? f.createIdentifier(S) : S,
    typeof identifier === 'string'
      ? f.createIdentifier(identifier)
      : identifier,
  )

export const callCreateCallExpression = (
  S: ts.Expression | string,
  identifier: ts.MemberName | string,
  typeArguments: readonly ts.TypeNode[] | undefined,
  argumentsArray: readonly ts.Expression[] | undefined,
) =>
  f.createCallExpression(
    callCreatePropertyAccessExpression(S, identifier),
    typeArguments,
    argumentsArray,
  )

export const callPipe = (
  typeArguments: readonly ts.TypeNode[] | undefined,
  argumentsArray: readonly ts.Expression[] | undefined,
) =>
  f.createCallExpression(
    f.createIdentifier('pipe'),
    typeArguments,
    argumentsArray,
  )

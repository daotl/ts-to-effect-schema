import ts from 'typescript'

const { factory: f } = ts

/**
 * Type hint effect to deal with recursive types.
 *
 * https://github.com/colinhacks/effect/tree/v3#recursive-types
 */
export function transformRecursiveSchema(
  effectImportValue: string,
  effectStatement: ts.VariableStatement,
  typeName: string,
): ts.VariableStatement {
  const declaration = effectStatement.declarationList.declarations[0]

  if (!declaration.initializer) {
    throw new Error('Unvalid effect statement')
  }

  return f.createVariableStatement(
    effectStatement.modifiers,
    f.createVariableDeclarationList(
      [
        f.createVariableDeclaration(
          declaration.name,
          undefined,
          f.createTypeReferenceNode(`${effectImportValue}.Schema`, [
            f.createTypeReferenceNode('ReplaceTypeDeep', [
              f.createTypeReferenceNode('ReadonlyDeep', [
                f.createTypeReferenceNode(typeName),
              ]),
              f.createTypeReferenceNode('Date'),
              f.createTypeReferenceNode('string'),
            ]),
            f.createTypeReferenceNode('ReadonlyDeep', [
              f.createTypeReferenceNode(typeName),
            ]),
          ]),
          f.createCallExpression(
            f.createPropertyAccessExpression(
              f.createIdentifier(effectImportValue),
              f.createIdentifier('lazy'),
            ),
            undefined,
            [
              f.createArrowFunction(
                undefined,
                undefined,
                [],
                undefined,
                undefined,
                declaration.initializer,
              ),
            ],
          ),
        ),
      ],
      ts.NodeFlags.Const,
    ),
  )
}

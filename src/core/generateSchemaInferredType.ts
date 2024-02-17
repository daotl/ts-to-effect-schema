import * as ts from 'typescript'
const { factory: f } = ts

export interface GenerateEffectInferredTypeProps {
  aliasName: string
  effectImportValue: string
  effectConstName: string
}

/**
 * Generate effect inferred type.
 *
 * ```ts
 *  export type ${aliasName} = ${effectImportValue}.infer<typeof ${effectConstName}>
 * ```
 */
export function generateSchemaInferredType({
  aliasName,
  effectImportValue,
  effectConstName,
}: GenerateEffectInferredTypeProps) {
  return f.createTypeAliasDeclaration(
    [f.createModifier(ts.SyntaxKind.ExportKeyword)],
    f.createIdentifier(aliasName),
    undefined,
    f.createTypeReferenceNode(
      f.createQualifiedName(
        f.createIdentifier(effectImportValue),
        f.createIdentifier('Schema.To'),
      ),
      [f.createTypeQueryNode(f.createIdentifier(effectConstName))],
    ),
  )
}

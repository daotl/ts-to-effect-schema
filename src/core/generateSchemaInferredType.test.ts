import ts from 'typescript'
import { generateSchemaInferredType } from './generateSchemaInferredType'

describe('generateSchemaInferredType', () => {
  it('should generate inferred type effect schema', () => {
    const sourceFile = ts.createSourceFile(
      'index.ts',
      `export const supermanSchema = S.struct({
      name: S.string,
    })`,
      ts.ScriptTarget.Latest,
    )

    const output = generateSchemaInferredType({
      aliasName: 'Superman',
      effectConstName: 'supermanSchema',
      effectImportValue: 'S',
    })

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })

    expect(
      printer.printNode(ts.EmitHint.Unspecified, output, sourceFile),
    ).toMatchInlineSnapshot(
      `"export type Superman = S.Schema.To<typeof supermanSchema>;"`,
    )
  })
})

import ts from 'typescript'
import { generateSchemaInferredType } from './generateSchemaInferredType'

describe('generateSchemaInferredType', () => {
  it('should generate inferred type zod schema', () => {
    const sourceFile = ts.createSourceFile(
      'index.ts',
      `export const supermanSchema = z.object({
      name: z.string(),
    })`,
      ts.ScriptTarget.Latest,
    )

    const output = generateSchemaInferredType({
      aliasName: 'Superman',
      zodConstName: 'supermanSchema',
      zodImportValue: 'z',
    })

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })

    expect(
      printer.printNode(ts.EmitHint.Unspecified, output, sourceFile),
    ).toMatchInlineSnapshot(
      `"export type Superman = z.infer<typeof supermanSchema>;"`,
    )
  })
})

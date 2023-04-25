import ts from 'typescript'
import { findNode } from '../utils/findNode'
import { transformRecursiveSchema } from './transformRecursiveSchema'

describe('transformRecursiveSchema', () => {
  it('should wrap the variable declaration with the appropriate syntax', () => {
    const sourceFile = ts.createSourceFile(
      'index.ts',
      `export const categorySchema = S.struct({
      name: S.string,
      subcategories: S.array(categorySchema),
    })`,
      ts.ScriptTarget.Latest,
    )

    const declaration = findNode(sourceFile, ts.isVariableStatement)
    if (!declaration) {
      fail('should have a variable declaration')
    }

    const output = transformRecursiveSchema('S', declaration, 'Category')

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })

    expect(
      printer.printNode(ts.EmitHint.Unspecified, output, sourceFile),
    ).toMatchInlineSnapshot(`
      "export const categorySchema: S.Schema<ReplaceTypeDeep<ReadonlyDeep<Category>, Date, string>, ReadonlyDeep<Category>> = S.lazy(() => S.struct({
          name: S.string,
          subcategories: S.array(categorySchema),
      }));"
    `)
  })

  it('should throw if the statement is not valid', () => {
    const sourceFile = ts.createSourceFile(
      'index.ts',
      `export const categorySchema;
    })`,
      ts.ScriptTarget.Latest,
    )

    const declaration = findNode(sourceFile, ts.isVariableStatement)
    if (!declaration) {
      fail('should have a variable declaration')
    }

    expect(() =>
      transformRecursiveSchema('S', declaration, 'Category'),
    ).toThrowErrorMatchingInlineSnapshot(`"Unvalid effect statement"`)
  })
})

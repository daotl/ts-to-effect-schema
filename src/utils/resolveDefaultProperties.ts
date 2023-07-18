import ts from 'typescript'
import { getJSDocTags } from '../core/jsDocTags'

/**
 * Remove optional properties when `@default` jsdoc tag is defined.
 *
 * Indeed, `S.optional(S.{type}).withDefault({value})` will be
 * compile as a non-optional type.
 */
export function resolveDefaultProperties(sourceText: string) {
  const sourceFile = ts.createSourceFile(
    'index.ts',
    sourceText,
    ts.ScriptTarget.Latest,
  )
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })

  const removeOptionalTransformer: ts.TransformerFactory<ts.SourceFile> = (
    context,
  ) => {
    const visit: ts.Visitor<ts.Node, ts.Node> = (_node) => {
      const node = ts.visitEachChild(_node, visit, context)

      if (ts.isPropertySignature(node)) {
        const jsDocTags = getJSDocTags(node, sourceFile)
        if (jsDocTags.default !== undefined) {
          const type = node.type
            ? ts.visitEachChild(node.type, omitUndefinedKeyword, context)
            : undefined
          return ts.factory.createPropertySignature(
            node.modifiers,
            node.name,
            undefined, // Remove `questionToken`
            type,
          )
        }
      }
      return node
    }

    return (node) =>
      ts.visitNode<ts.SourceFile, ts.Node, ts.SourceFile>(
        node,
        visit,
        ts.isSourceFile,
      )
  }

  const outputFile = ts.transform(sourceFile, [removeOptionalTransformer])

  return printer.printFile(outputFile.transformed[0])
}

function omitUndefinedKeyword(node: ts.Node) {
  if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
    return undefined
  }
  return node
}

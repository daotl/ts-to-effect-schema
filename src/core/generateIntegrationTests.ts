import ts from 'typescript'
const { factory: f } = ts

interface TestCase {
  effectType: string
  tsType: string
}

/**
 * Generate integration tests to validate if the generated effect schemas
 * are equals to the originals types.
 *
 * ```ts
 * expectType<${tsType}>({} as ${effectType})
 * expectType<${effectType}>({} as ${tsType})
 * ```
 */
export function generateIntegrationTests(testCases: TestCase[]) {
  return testCases
    .map((testCase) => [
      f.createCallExpression(
        f.createIdentifier('expectType'),
        [
          f.createTypeReferenceNode('ReadonlyDeep', [
            f.createTypeReferenceNode(testCase.tsType),
          ]),
        ],
        [
          f.createAsExpression(
            f.createObjectLiteralExpression(),
            f.createTypeReferenceNode('ReadonlyDeep', [
              f.createTypeReferenceNode(testCase.tsType),
            ]),
          ),
        ],
      ),
      f.createCallExpression(
        f.createIdentifier('expectType'),
        [
          f.createTypeReferenceNode('ReadonlyDeep', [
            f.createTypeReferenceNode(testCase.tsType),
          ]),
        ],
        [
          f.createAsExpression(
            f.createObjectLiteralExpression(),
            f.createTypeReferenceNode('ReadonlyDeep', [
              f.createTypeReferenceNode(testCase.tsType),
            ]),
          ),
        ],
      ),
    ])
    .reduce((mem, i) => [...mem, ...i], [])
}

import { camel, lower } from 'case'
import uniq from 'lodash/uniq'
import * as ts from 'typescript'
import {
  callCreateCallExpression,
  // callCreatePropertyAccessExpression,
} from '../utils/commonSchema'
import { findNode } from '../utils/findNode'
import { isNotNull } from '../utils/isNotNull'
import { primitivePropertyList, standardBuiltInObjects } from './const'
import {
  EffectSchemaProperty,
  JSDocTags,
  getJSDocTags,
  jsDocTagToEffectSchemaProperties,
} from './jsDocTags'

const { factory: f } = ts

export interface GenerateEffectSchemaProps {
  /**
   * Name of the exported variable
   */
  varName: string

  /**
   * Name of the standard built-in object
   */
  typeName?: string

  /**
   * Interface or type node
   */
  node?: ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.EnumDeclaration

  /**
   * effect schema import value.
   *
   * @default "S"
   */
  schemaImportValue?: string

  /**
   * Source file
   */
  sourceFile: ts.SourceFile

  /**
   * Getter for schema dependencies (Type reference inside type)
   *
   * @default (identifierName) => camel(`${identifierName}Schema`)
   */
  getDependencyName?: (identifierName: string) => string

  /**
   * Skip the creation of effect schema validators from JSDoc annotations
   *
   * @default false
   */
  skipParseJSDoc?: boolean
}

/**
 * Generate effect schema declaration
 *
 * ```ts
 * export const ${varName} = ${schemaImportValue}.object(…)
 * ```
 */
export function generateSchemaVariableStatement({
  node,
  typeName,
  sourceFile,
  varName,
  schemaImportValue = 'S',
  getDependencyName = (identifierName) => camel(`${identifierName}Schema`),
  skipParseJSDoc = false,
}: GenerateEffectSchemaProps) {
  let schema:
    | ts.CallExpression
    | ts.Identifier
    | ts.PropertyAccessExpression
    | undefined
  let dependencies: string[] = []
  let requiresImport = false

  if (!node) {
    if (standardBuiltInObjects.includes(typeName as string)) {
      schema = buildEffectSchema(schemaImportValue, 'instanceOf', [
        f.createIdentifier(typeName as string),
      ])
      requiresImport = false
    }
  } else if (ts.isInterfaceDeclaration(node)) {
    let schemaExtensionClauses: string[] | undefined
    if (node.typeParameters) {
      throw new Error('Interface with generics are not supported!')
    }
    if (node.heritageClauses) {
      // Looping on heritageClauses browses the "extends" keywords
      schemaExtensionClauses = node.heritageClauses.reduce(
        (deps: string[], h) => {
          if (h.token !== ts.SyntaxKind.ExtendsKeyword || !h.types) {
            return deps
          }

          // Looping on types browses the comma-separated interfaces
          const heritages = h.types.map((expression) => {
            return getDependencyName(expression.getText(sourceFile))
          })

          return deps.concat(heritages)
        },
        [],
      )

      dependencies = dependencies.concat(schemaExtensionClauses)
    }

    schema = buildEffectSchemaObject({
      typeNode: node,
      sourceFile,
      S: schemaImportValue,
      dependencies,
      getDependencyName,
      schemaExtensionClauses,
      skipParseJSDoc,
    })
  } else if (ts.isTypeAliasDeclaration(node)) {
    if (node.typeParameters) {
      throw new Error('Type with generics are not supported!')
    }
    const jsDocTags = skipParseJSDoc ? {} : getJSDocTags(node, sourceFile)

    schema = buildEffectSchemaPrimitive({
      S: schemaImportValue,
      typeNode: node.type,
      isOptional: false,
      jsDocTags,
      sourceFile,
      dependencies,
      getDependencyName,
      skipParseJSDoc,
    })
  } else if (ts.isEnumDeclaration(node)) {
    schema = buildEffectSchema(schemaImportValue, 'enums', [node.name])
    requiresImport = true
  }

  return {
    dependencies: uniq(dependencies),
    statement: f.createVariableStatement(
      node?.modifiers,
      f.createVariableDeclarationList(
        [
          f.createVariableDeclaration(
            f.createIdentifier(varName),
            undefined,
            undefined,
            schema,
          ),
        ],
        ts.NodeFlags.Const,
      ),
    ),
    requiresImport,
  }
}

function buildEffectSchemaProperties({
  members,
  schemaImportValue: S,
  sourceFile,
  dependencies,
  getDependencyName,
  skipParseJSDoc,
}: {
  members: ts.NodeArray<ts.TypeElement> | ts.PropertySignature[]
  schemaImportValue: string
  sourceFile: ts.SourceFile
  dependencies: string[]
  getDependencyName: (identifierName: string) => string
  skipParseJSDoc: boolean
}) {
  const properties = new Map<
    ts.Identifier | ts.StringLiteral | ts.NumericLiteral,
    ts.CallExpression | ts.Identifier | ts.PropertyAccessExpression
  >()
  members.forEach((member) => {
    if (
      !ts.isPropertySignature(member) ||
      !member.type ||
      !(
        ts.isIdentifier(member.name) ||
        ts.isStringLiteral(member.name) ||
        ts.isNumericLiteral(member.name)
      )
    ) {
      return
    }

    const isOptional = Boolean(member.questionToken)
    const jsDocTags = skipParseJSDoc ? {} : getJSDocTags(member, sourceFile)

    properties.set(
      member.name,
      buildEffectSchemaPrimitive({
        S,
        typeNode: member.type,
        isOptional,
        jsDocTags,
        sourceFile,
        dependencies,
        getDependencyName,
        skipParseJSDoc,
      }),
    )
  })
  return properties
}

function buildEffectSchemaPrimitive({
  S,
  typeNode,
  isOptional,
  isNullable,
  isPartial,
  isRequired,
  jsDocTags,
  sourceFile,
  dependencies,
  getDependencyName,
  skipParseJSDoc,
}: {
  S: string
  typeNode: ts.TypeNode
  isOptional: boolean
  isNullable?: boolean
  isPartial?: boolean
  isRequired?: boolean
  jsDocTags: JSDocTags
  sourceFile: ts.SourceFile
  dependencies: string[]
  getDependencyName: (identifierName: string) => string
  skipParseJSDoc: boolean
}): ts.CallExpression | ts.Identifier | ts.PropertyAccessExpression {
  const effectSchemaProperties = jsDocTagToEffectSchemaProperties(
    jsDocTags,
    isOptional,
    Boolean(isPartial),
    Boolean(isRequired),
    Boolean(isNullable),
  )

  if (ts.isParenthesizedTypeNode(typeNode)) {
    return buildEffectSchemaPrimitive({
      S,
      typeNode: typeNode.type,
      isOptional,
      jsDocTags,
      sourceFile,
      dependencies,
      getDependencyName,
      skipParseJSDoc,
    })
  }

  if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
    const identifierName = typeNode.typeName.text

    // Deal with `Array<>` syntax
    if (identifierName === 'Array' && typeNode.typeArguments) {
      return buildEffectSchemaPrimitive({
        S,
        typeNode: f.createArrayTypeNode(typeNode.typeArguments[0]),
        isOptional,
        isNullable,
        jsDocTags: {},
        sourceFile,
        dependencies,
        getDependencyName,
        skipParseJSDoc,
      })
    }

    // Deal with `Partial<>` syntax
    if (identifierName === 'Partial' && typeNode.typeArguments) {
      return buildEffectSchemaPrimitive({
        S,
        typeNode: typeNode.typeArguments[0],
        isOptional,
        isNullable,
        jsDocTags,
        sourceFile,
        isPartial: true,
        dependencies,
        getDependencyName,
        skipParseJSDoc,
      })
    }

    // Deal with `Required<>` syntax
    if (identifierName === 'Required' && typeNode.typeArguments) {
      return buildEffectSchemaPrimitive({
        S,
        typeNode: typeNode.typeArguments[0],
        isOptional,
        isNullable,
        jsDocTags,
        sourceFile,
        isRequired: true,
        dependencies,
        getDependencyName,
        skipParseJSDoc,
      })
    }

    // Deal with `Readonly<>` syntax
    if (identifierName === 'Readonly' && typeNode.typeArguments) {
      return buildEffectSchemaPrimitive({
        S,
        typeNode: typeNode.typeArguments[0],
        isOptional,
        isNullable,
        jsDocTags,
        sourceFile,
        dependencies,
        getDependencyName,
        skipParseJSDoc,
      })
    }

    // Deal with `ReadonlyArray<>` syntax
    if (identifierName === 'ReadonlyArray' && typeNode.typeArguments) {
      return buildEffectSchema(
        S,
        'array',
        [
          buildEffectSchemaPrimitive({
            S,
            typeNode: typeNode.typeArguments[0],
            isOptional: false,
            jsDocTags: {},
            sourceFile,
            dependencies,
            getDependencyName,
            skipParseJSDoc,
          }),
        ],
        effectSchemaProperties,
      )
    }

    // Deal with `Record<>` syntax
    if (identifierName === 'Record' && typeNode.typeArguments) {
      if (
        typeNode.typeArguments.length !== 2 ||
        typeNode.typeArguments[0].kind !== ts.SyntaxKind.StringKeyword
      ) {
        throw new Error(
          `Record<${typeNode.typeArguments[0].getText(
            sourceFile,
          )}, …> are not supported (https://github.com/effect-ts/schema#records)`,
        )
      }
      return buildEffectSchema(
        S,
        'record',
        [
          f.createPropertyAccessExpression(
            f.createIdentifier(S),
            f.createIdentifier('string'),
          ),
          buildEffectSchemaPrimitive({
            S,
            typeNode: typeNode.typeArguments[1],
            isOptional: false,
            jsDocTags,
            sourceFile,
            isPartial: false,
            dependencies,
            getDependencyName,
            skipParseJSDoc,
          }),
        ],
        effectSchemaProperties,
      )
    }

    // Deal with `Date`
    if (identifierName === 'Date') {
      return buildEffectSchema(S, 'Date', [], effectSchemaProperties)
    }

    // Deal with `Set<>` syntax
    if (identifierName === 'Set' && typeNode.typeArguments) {
      return buildEffectSchema(
        S,
        'set',
        typeNode.typeArguments.map((i) =>
          buildEffectSchemaPrimitive({
            S,
            typeNode: i,
            isOptional: false,
            jsDocTags,
            sourceFile,
            dependencies,
            getDependencyName,
            skipParseJSDoc,
          }),
        ),
        effectSchemaProperties,
      )
    }

    // Deal with `Promise<>` syntax
    // if (identifierName === 'Promise' && typeNode.typeArguments) {
    //   return buildEffectSchema(
    //     S,
    //     'promise',
    //     typeNode.typeArguments.map((i) =>
    //       buildEffectSchemaPrimitive({
    //         S,
    //         typeNode: i,
    //         isOptional: false,
    //         jsDocTags,
    //         sourceFile,
    //         dependencies,
    //         getDependencyName,
    //         skipParseJSDoc,
    //       }),
    //     ),
    //     effectSchemaProperties,
    //   )
    // }

    // Deal with `Omit<>` & `Pick<>` syntax
    if (['Omit', 'Pick'].includes(identifierName) && typeNode.typeArguments) {
      const [originalType, keys] = typeNode.typeArguments
      let parameters: ts.ObjectLiteralExpression | undefined

      if (ts.isLiteralTypeNode(keys)) {
        parameters = f.createObjectLiteralExpression([
          f.createPropertyAssignment(
            keys.literal.getText(sourceFile),
            f.createTrue(),
          ),
        ])
      }
      if (ts.isUnionTypeNode(keys)) {
        parameters = f.createObjectLiteralExpression(
          keys.types.map((type) => {
            if (!ts.isLiteralTypeNode(type)) {
              throw new Error(
                `${identifierName}<T, K> unknown syntax: (${
                  ts.SyntaxKind[type.kind]
                } as K union part not supported)`,
              )
            }
            return f.createPropertyAssignment(
              type.literal.getText(sourceFile),
              f.createTrue(),
            )
          }),
        )
      }
      if (!parameters) {
        throw new Error(
          `${identifierName}<T, K> unknown syntax: (${
            ts.SyntaxKind[keys.kind]
          } as K not supported)`,
        )
      }

      return f.createCallExpression(
        f.createPropertyAccessExpression(
          buildEffectSchemaPrimitive({
            S,
            typeNode: originalType,
            isOptional: false,
            jsDocTags: {},
            sourceFile,
            dependencies,
            getDependencyName,
            skipParseJSDoc,
          }),
          f.createIdentifier(lower(identifierName)),
        ),
        undefined,
        [parameters],
      )
    }

    const dependencyName = getDependencyName(identifierName)
    dependencies.push(dependencyName)
    const effectSchema: ts.Identifier | ts.CallExpression =
      f.createIdentifier(dependencyName)
    return withEffectSchemaProperties(S, effectSchema, effectSchemaProperties)
  }

  if (ts.isUnionTypeNode(typeNode)) {
    const hasNull = Boolean(
      typeNode.types.find(
        (i) =>
          ts.isLiteralTypeNode(i) &&
          i.literal.kind === ts.SyntaxKind.NullKeyword,
      ),
    )

    const nodes = typeNode.types.filter(isNotNull)

    // type A = | 'b' is a valid typescript definition
    // Effect schema does not allow `z.union(['b']), so we have to return just the value
    if (nodes.length === 1) {
      return buildEffectSchemaPrimitive({
        S,
        typeNode: nodes[0],
        isOptional,
        isNullable: hasNull,
        jsDocTags,
        sourceFile,
        dependencies,
        getDependencyName,
        skipParseJSDoc,
      })
    }

    const values = nodes.map((i) =>
      buildEffectSchemaPrimitive({
        S,
        typeNode: i,
        isOptional: false,
        isNullable: false,
        jsDocTags: {},
        sourceFile,
        dependencies,
        getDependencyName,
        skipParseJSDoc,
      }),
    )

    // Handling null value outside of the union type
    if (hasNull) {
      effectSchemaProperties.push({
        identifier: 'nullable',
      })
    }

    return buildEffectSchema(S, 'union', values, effectSchemaProperties)
  }

  if (ts.isTupleTypeNode(typeNode)) {
    const values = typeNode.elements.map((i) =>
      buildEffectSchemaPrimitive({
        S,
        typeNode: ts.isNamedTupleMember(i) ? i.type : i,
        isOptional: false,
        jsDocTags: {},
        sourceFile,
        dependencies,
        getDependencyName,
        skipParseJSDoc,
      }),
    )
    return buildEffectSchema(S, 'tuple', values, effectSchemaProperties)
  }

  if (ts.isLiteralTypeNode(typeNode)) {
    if (ts.isStringLiteral(typeNode.literal)) {
      return buildEffectSchema(
        S,
        'literal',
        [f.createStringLiteral(typeNode.literal.text)],
        effectSchemaProperties,
      )
    }
    if (ts.isNumericLiteral(typeNode.literal)) {
      return buildEffectSchema(
        S,
        'literal',
        [f.createNumericLiteral(typeNode.literal.text)],
        effectSchemaProperties,
      )
    }
    if (typeNode.literal.kind === ts.SyntaxKind.TrueKeyword) {
      return buildEffectSchema(
        S,
        'literal',
        [f.createTrue()],
        effectSchemaProperties,
      )
    }
    if (typeNode.literal.kind === ts.SyntaxKind.FalseKeyword) {
      return buildEffectSchema(
        S,
        'literal',
        [f.createFalse()],
        effectSchemaProperties,
      )
    }
  }

  // Deal with enums used as literals
  if (
    ts.isTypeReferenceNode(typeNode) &&
    ts.isQualifiedName(typeNode.typeName) &&
    ts.isIdentifier(typeNode.typeName.left)
  ) {
    return buildEffectSchema(
      S,
      'literal',
      [
        f.createPropertyAccessExpression(
          typeNode.typeName.left,
          typeNode.typeName.right,
        ),
      ],
      effectSchemaProperties,
    )
  }

  if (ts.isArrayTypeNode(typeNode)) {
    return buildEffectSchema(
      S,
      'array',
      [
        buildEffectSchemaPrimitive({
          S,
          typeNode: typeNode.elementType,
          isOptional: false,
          jsDocTags: {},
          sourceFile,
          dependencies,
          getDependencyName,
          skipParseJSDoc,
        }),
      ],
      effectSchemaProperties,
    )
  }

  if (ts.isTypeLiteralNode(typeNode)) {
    return withEffectSchemaProperties(
      S,
      buildEffectSchemaObject({
        typeNode,
        S,
        sourceFile,
        dependencies,
        getDependencyName,
        skipParseJSDoc,
      }),
      effectSchemaProperties,
    )
  }

  if (ts.isIntersectionTypeNode(typeNode)) {
    const [base, ...rest] = typeNode.types
    const basePrimitive = buildEffectSchemaPrimitive({
      S,
      typeNode: base,
      isOptional: false,
      jsDocTags: {},
      sourceFile,
      dependencies,
      getDependencyName,
      skipParseJSDoc,
    })

    return rest.reduce((intersectionSchema, node) => {
      return callCreateCallExpression(intersectionSchema, 'pipe', undefined, [
        callCreateCallExpression(S, 'extend', undefined, [
          f.createCallExpression(
            f.createIdentifier('omitCommonProperties'),
            undefined,
            [
              buildEffectSchemaPrimitive({
                S,
                typeNode: node,
                isOptional: false,
                jsDocTags: {},
                sourceFile,
                dependencies,
                getDependencyName,
                skipParseJSDoc,
              }),
              intersectionSchema,
            ],
          ),
        ]),
      ])
    }, basePrimitive)
  }

  if (ts.isLiteralTypeNode(typeNode)) {
    return buildEffectSchema(
      S,
      typeNode.literal.getText(sourceFile),
      [],
      effectSchemaProperties,
    )
  }

  // if (ts.isFunctionTypeNode(typeNode)) {
  //   return buildEffectSchema(
  //     S,
  //     'function',
  //     [],
  //     [
  //       {
  //         identifier: 'args',
  //         expressions: typeNode.parameters.map((p) =>
  //           buildEffectSchemaPrimitive({
  //             S,
  //             typeNode:
  //               p.type || f.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
  //             jsDocTags,
  //             sourceFile,
  //             dependencies,
  //             getDependencyName,
  //             isOptional: Boolean(p.questionToken),
  //             skipParseJSDoc,
  //           }),
  //         ),
  //       },
  //       {
  //         identifier: 'returns',
  //         expressions: [
  //           buildEffectSchemaPrimitive({
  //             S,
  //             typeNode: typeNode.type,
  //             jsDocTags,
  //             sourceFile,
  //             dependencies,
  //             getDependencyName,
  //             isOptional: false,
  //             skipParseJSDoc,
  //           }),
  //         ],
  //       },
  //       ...effectSchemaProperties,
  //     ],
  //   )
  // }

  if (ts.isIndexedAccessTypeNode(typeNode)) {
    return buildSchemaReference({
      node: typeNode,
      getDependencyName,
      sourceFile,
      dependencies,
    })
  }

  switch (typeNode.kind) {
    case ts.SyntaxKind.StringKeyword:
      return buildEffectSchema(S, 'string', [], effectSchemaProperties)
    case ts.SyntaxKind.BooleanKeyword:
      return buildEffectSchema(S, 'boolean', [], effectSchemaProperties)
    case ts.SyntaxKind.UndefinedKeyword:
      return buildEffectSchema(S, 'undefined', [], effectSchemaProperties)
    case ts.SyntaxKind.NumberKeyword:
      return buildEffectSchema(S, 'number', [], effectSchemaProperties)
    case ts.SyntaxKind.AnyKeyword:
      return buildEffectSchema(S, 'any', [], effectSchemaProperties)
    case ts.SyntaxKind.BigIntKeyword:
      return buildEffectSchema(S, 'bigint', [], effectSchemaProperties)
    case ts.SyntaxKind.VoidKeyword:
      return buildEffectSchema(S, 'void', [], effectSchemaProperties)
    case ts.SyntaxKind.NeverKeyword:
      return buildEffectSchema(S, 'never', [], effectSchemaProperties)
    case ts.SyntaxKind.UnknownKeyword:
      return buildEffectSchema(S, 'unknown', [], effectSchemaProperties)
  }

  console.warn(
    ` »   Warning: '${
      ts.SyntaxKind[typeNode.kind]
    }' is not supported, fallback into 'any'`,
  )
  return buildEffectSchema(S, 'any', [], effectSchemaProperties)
}

/**
 * Build a effect schema.
 *
 * @param S effect schema namespace
 * @param callName effect schema function
 * @param args Args to add to the main effect schema call, if any
 * @param properties An array of flags that should be added as extra property calls such as optional to add .optional()
 */
function buildEffectSchema(
  S: string,
  callName: string,
  args?: ts.Expression[],
  properties?: EffectSchemaProperty[],
) {
  const expression = f.createPropertyAccessExpression(
    f.createIdentifier(S),
    f.createIdentifier(callName),
  )

  const effect = primitivePropertyList.includes(
    expression.name.escapedText as string,
  )
    ? expression
    : f.createCallExpression(expression, undefined, args)
  return withEffectSchemaProperties(S, effect, properties)
}

function buildEffectSchemaExtendedSchema(
  S: string,
  schemaList: string[],
  args?: ts.Expression[],
  properties?: EffectSchemaProperty[],
) {
  let effectSchemaCall = f.createIdentifier(schemaList[0]) as ts.Expression
  for (let i = 1; i < schemaList.length; i++) {
    effectSchemaCall = callCreateCallExpression(
      effectSchemaCall,
      'pipe',
      undefined,
      [
        callCreateCallExpression(S, 'extend', undefined, [
          f.createCallExpression(
            f.createIdentifier('omitCommonProperties'),
            undefined,
            [f.createIdentifier(schemaList[i]), effectSchemaCall],
          ),
        ]),
      ],
    )
  }

  if (args?.length) {
    effectSchemaCall = callCreateCallExpression(
      effectSchemaCall,
      'pipe',
      undefined,
      [
        callCreateCallExpression(S, 'extend', undefined, [
          f.createCallExpression(
            f.createIdentifier('omitCommonProperties'),
            undefined,
            [...args, effectSchemaCall],
          ),
        ]),
      ],
    )
  }

  return withEffectSchemaProperties(S, effectSchemaCall, properties)
}

/**
 * Apply effect schema properties to an expression (as `.optional()`)
 *
 * @param expression
 * @param properties
 */
function withEffectSchemaProperties(
  s: string,
  expression: ts.Expression,
  properties: EffectSchemaProperty[] = [],
) {
  return properties.reduce((expressionWithProperties, property) => {
    if (property.identifier === 'default') {
      return callCreateCallExpression(s, 'optional', undefined, [
        expressionWithProperties,
        ...(property.expressions ?? []),
      ])

      // return callCreatePropertyAccessExpression(
      //   optionalExpression,
      //   (property.expressions as unknown as [ts.MemberName])[0],
      // )
      //  callCreateCallExpression(
      //     s,
      //     property.identifier,
      //     undefined,
      //     property.expressions ? property.expressions : [expressionWithProperties],
      //   )
    }

    const e = callCreateCallExpression(
      s,
      property.identifier,
      undefined,
      property.expressions ? property.expressions : [expressionWithProperties],
    )

    const ex = expressionWithProperties as unknown as {
      expression: ts.Identifier
      arguments: ts.Expression[]
    }

    if (property.expressions) {
      // Reduce unnecessary "pipe"
      return ex.expression.escapedText === 'pipe'
        ? {
            ...expressionWithProperties,
            arguments: [...ex.arguments, e],
          }
        : callCreateCallExpression(
            expressionWithProperties,
            'pipe',
            undefined,
            [e],
          )
    }

    return e
  }, expression) as ts.CallExpression
}

/**
 * Build z.object (with support of index signature)
 */
function buildEffectSchemaObject({
  typeNode,
  S,
  dependencies,
  sourceFile,
  getDependencyName,
  schemaExtensionClauses,
  skipParseJSDoc,
}: {
  typeNode: ts.TypeLiteralNode | ts.InterfaceDeclaration
  S: string
  dependencies: string[]
  sourceFile: ts.SourceFile
  getDependencyName: Required<GenerateEffectSchemaProps>['getDependencyName']
  schemaExtensionClauses?: string[]
  skipParseJSDoc: boolean
}) {
  const { properties, indexSignature } = typeNode.members.reduce<{
    properties: ts.PropertySignature[]
    indexSignature?: ts.IndexSignatureDeclaration
  }>(
    (mem, member) => {
      if (ts.isIndexSignatureDeclaration(member)) {
        return {
          ...mem,
          indexSignature: member,
        }
      }
      if (ts.isPropertySignature(member)) {
        return {
          ...mem,
          properties: [...mem.properties, member],
        }
      }
      return mem
    },
    { properties: [] },
  )

  let objectSchema: ts.CallExpression | undefined

  const parsedProperties =
    properties.length > 0
      ? buildEffectSchemaProperties({
          members: properties,
          schemaImportValue: S,
          sourceFile,
          dependencies,
          getDependencyName,
          skipParseJSDoc,
        })
      : new Map()

  if (schemaExtensionClauses && schemaExtensionClauses.length > 0) {
    objectSchema = buildEffectSchemaExtendedSchema(
      S,
      schemaExtensionClauses,
      properties.length > 0
        ? [
            callCreateCallExpression(S, 'struct', undefined, [
              f.createObjectLiteralExpression(
                Array.from(parsedProperties.entries()).map(([key, tsCall]) => {
                  return f.createPropertyAssignment(key, tsCall)
                }),
                true,
              ),
            ]),
          ]
        : undefined,
    )
  } else if (properties.length > 0) {
    objectSchema = buildEffectSchema(S, 'struct', [
      f.createObjectLiteralExpression(
        Array.from(parsedProperties.entries()).map(([key, tsCall]) => {
          return f.createPropertyAssignment(key, tsCall)
        }),
        true,
      ),
    ])
  }
  if (indexSignature) {
    if (schemaExtensionClauses) {
      throw new Error(
        'interface with `extends` and index signature are not supported!',
      )
    }
    const indexSignatureSchema = buildEffectSchema(S, 'record', [
      f.createPropertyAccessExpression(
        f.createIdentifier(S),
        f.createIdentifier('string'),
      ),
      // Index signature type can't be optional or have validators.
      buildEffectSchemaPrimitive({
        S,
        typeNode: indexSignature.type,
        isOptional: false,
        jsDocTags: {},
        sourceFile,
        dependencies,
        getDependencyName,
        skipParseJSDoc,
      }),
    ])

    if (objectSchema) {
      return f.createCallExpression(
        f.createPropertyAccessExpression(
          indexSignatureSchema,
          f.createIdentifier('and'),
        ),
        undefined,
        [objectSchema],
      )
    }
    return indexSignatureSchema
  } else if (objectSchema) {
    return objectSchema
  }
  return buildEffectSchema(S, 'struct', [f.createObjectLiteralExpression()])
}

/**
 * Build a schema reference from an IndexedAccessTypeNode
 *
 * example: Superman["power"]["fly"] -> SupermanSchema.shape.power.shape.fly
 */
function buildSchemaReference(
  {
    node,
    dependencies,
    sourceFile,
    getDependencyName,
  }: {
    node: ts.IndexedAccessTypeNode
    dependencies: string[]
    sourceFile: ts.SourceFile
    getDependencyName: Required<GenerateEffectSchemaProps>['getDependencyName']
  },
  path = '',
): ts.PropertyAccessExpression | ts.Identifier {
  const indexTypeText = node.indexType.getText(sourceFile)
  const { indexTypeName, type: indexTypeType } = /^"\w+"$/.exec(indexTypeText)
    ? { type: 'string' as const, indexTypeName: indexTypeText.slice(1, -1) }
    : { type: 'number' as const, indexTypeName: indexTypeText }

  if (indexTypeName === '-1') {
    // Get the original type declaration
    const declaration = findNode(
      sourceFile,
      (n): n is ts.InterfaceDeclaration | ts.TypeAliasDeclaration => {
        return (
          (ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n)) &&
          ts.isIndexedAccessTypeNode(node.objectType) &&
          n.name.getText(sourceFile) ===
            node.objectType.objectType.getText(sourceFile).split('[')[0]
        )
      },
    )

    if (declaration && ts.isIndexedAccessTypeNode(node.objectType)) {
      const key = node.objectType.indexType.getText(sourceFile).slice(1, -1) // remove quotes
      const members =
        ts.isTypeAliasDeclaration(declaration) &&
        ts.isTypeLiteralNode(declaration.type)
          ? declaration.type.members
          : ts.isInterfaceDeclaration(declaration)
          ? declaration.members
          : []

      const member = members.find((m) => m.name?.getText(sourceFile) === key)

      if (member && ts.isPropertySignature(member) && member.type) {
        // Array<type>
        if (
          ts.isTypeReferenceNode(member.type) &&
          member.type.typeName.getText(sourceFile) === 'Array'
        ) {
          return buildSchemaReference(
            {
              node: node.objectType,
              dependencies,
              sourceFile,
              getDependencyName,
            },
            `element.${path}`,
          )
        }
        // type[]
        if (ts.isArrayTypeNode(member.type)) {
          return buildSchemaReference(
            {
              node: node.objectType,
              dependencies,
              sourceFile,
              getDependencyName,
            },
            `element.${path}`,
          )
        }
        // Record<string, type>
        if (
          ts.isTypeReferenceNode(member.type) &&
          member.type.typeName.getText(sourceFile) === 'Record'
        ) {
          return buildSchemaReference(
            {
              node: node.objectType,
              dependencies,
              sourceFile,
              getDependencyName,
            },
            `${path}`,
          )
        }

        console.warn(
          ` »   Warning: indexAccessType can’t be resolved, fallback into 'any'`,
        )
        return f.createIdentifier('any')
      }
    }

    return f.createIdentifier('any')
  } else if (
    indexTypeType === 'number' &&
    ts.isIndexedAccessTypeNode(node.objectType)
  ) {
    return buildSchemaReference(
      { node: node.objectType, dependencies, sourceFile, getDependencyName },
      `[${indexTypeName}].${path}`,
    )
  }

  if (ts.isIndexedAccessTypeNode(node.objectType)) {
    return buildSchemaReference(
      { node: node.objectType, dependencies, sourceFile, getDependencyName },
      `${indexTypeName}.${path}`,
    )
  }

  if (ts.isTypeReferenceNode(node.objectType)) {
    const dependencyName = getDependencyName(
      node.objectType.typeName.getText(sourceFile),
    )
    dependencies.push(dependencyName)

    const e = f.createPropertyAccessExpression(
      f.createCallExpression(
        f.createIdentifier('getPropertySchemas'),
        undefined,
        [f.createIdentifier(dependencyName)],
      ),
      f.createIdentifier(indexTypeName),
    )

    return path
      ? f.createPropertyAccessExpression(
          f.createCallExpression(
            f.createIdentifier('getPropertySchemas'),
            undefined,
            [e],
          ),
          f.createIdentifier(path.slice(0, -1)),
        )
      : e
  }

  throw new Error('Unknown IndexedAccessTypeNode.objectType type')
}

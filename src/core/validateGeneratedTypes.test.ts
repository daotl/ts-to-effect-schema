import { validateGeneratedTypes } from './validateGeneratedTypes'

describe('validateGeneratedTypes', () => {
  it('should return no error if the types match', () => {
    const sourceTypes = {
      sourceText: `
      export type MyNumber = number;
    `,
      relativePath: 'source.ts',
    }

    const effectSchemas = {
      sourceText: `// Generated by ts-to-effect-schema
    import * as S from "@effect/schema/Schema";
    export const myNumberSchema = S.number;
    `,
      relativePath: 'source.schema.ts',
    }

    const integrationTests = {
      sourceText: `// Generated by ts-to-effect-schema
      import * as S from "@effect/schema/Schema";

      import * as spec from "./${sourceTypes.relativePath.slice(0, -3)}";
      import * as generated from "./${effectSchemas.relativePath.slice(0, -3)}";

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      function expectType<T>(_: T) {
        /* noop */
      }

      export type myNumberSchemaInferredType = S.Schema.To<typeof generated.myNumberSchema>;

      expectType<myNumberSchemaInferredType>({} as spec.MyNumber);
      expectType<spec.MyNumber>({} as myNumberSchemaInferredType);
  `,
      relativePath: 'source.integration.ts',
    }

    const errors = validateGeneratedTypes({
      sourceTypes,
      effectSchemas,
      integrationTests,
      skipParseJSDoc: false,
    })

    expect(errors).toEqual([])
  })

  it("should return an error if the types doesn't match", () => {
    const sourceTypes = {
      sourceText: `
      export type MyNumber = number;
    `,
      relativePath: 'source.ts',
    }

    const effectSchemas = {
      sourceText: `// Generated by ts-to-effect-schema
      import * as S from "@effect/schema/Schema";
      export const myStringSchema = S.string;
      `,
      relativePath: 'source.schema.ts',
    }

    const integrationTests = {
      sourceText: `// Generated by ts-to-effect-schema
      import * as S from "@effect/schema/Schema";

        import * as spec from "./${sourceTypes.relativePath.slice(0, -3)}";
        import * as generated from "./${effectSchemas.relativePath.slice(0, -3)}";

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        function expectType<T>(_: T) {
          /* noop */
        }

        export type myStringSchemaInferredType = S.Schema.To<typeof generated.myStringSchema>;

        expectType<myStringSchemaInferredType>({} as spec.MyNumber);
        expectType<spec.MyNumber>({} as myStringSchemaInferredType);
    `,
      relativePath: 'source.integration.ts',
    }

    const errors = validateGeneratedTypes({
      sourceTypes,
      effectSchemas,
      integrationTests,
      skipParseJSDoc: false,
    })

    expect(errors).toMatchInlineSnapshot(`
      [
        "'MyNumber' is not compatible with 'myStringSchema':
      Argument of type 'number' is not assignable to parameter of type 'string'.",
        "'myStringSchema' is not compatible with 'MyNumber':
      Argument of type 'string' is not assignable to parameter of type 'number'.",
      ]
    `)
  })

  it('should deal with optional value with default', () => {
    const sourceTypes = {
      sourceText: `
      export interface Citizen {
        /**
         * @default true
         */
        isVillain?: boolean;
      };
    `,
      relativePath: 'source.ts',
    }

    const effectSchemas = {
      sourceText: `// Generated by ts-to-effect-schema
      import * as S from "@effect/schema/Schema";
      export const citizenSchema = S.struct({
      isVillain: S.optional(S.boolean).withDefault(() => true)
    });
    `,
      relativePath: 'source.schema.ts',
    }

    const integrationTests = {
      sourceText: `// Generated by ts-to-effect-schema
      import * as S from "@effect/schema/Schema";
      import type { ReadonlyDeep } from "type-fest";

      import * as spec from "./${sourceTypes.relativePath.slice(0, -3)}";
      import * as generated from "./${effectSchemas.relativePath.slice(0, -3)}";

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      function expectType<T>(_: T) {
        /* noop */
      }
      export type CitizenInferredType = S.Schema.To<typeof generated.citizenSchema>;

      expectType<CitizenInferredType>({} as spec.Citizen);
      expectType<ReadonlyDeep<spec.Citizen>>({} as CitizenInferredType);
  `,
      relativePath: 'source.integration.ts',
    }

    const errors = validateGeneratedTypes({
      sourceTypes,
      effectSchemas,
      integrationTests,
      skipParseJSDoc: false,
    })

    expect(errors).toEqual([])
  })

  it('should skip defaults if `skipParseJSDoc` is `true`', () => {
    const sourceTypes = {
      sourceText: `
      export interface Citizen {
        /**
         * @default true
         */
        isVillain?: boolean;
      };
    `,
      relativePath: 'source.ts',
    }

    const effectSchemas = {
      sourceText: `// Generated by ts-to-effect-schema
    import * as S from "@effect/schema/Schema";
    export const citizenSchema = S.struct({
      isVillain: S.optional(S.boolean).withDefault(() => true)
    });
    `,
      relativePath: 'source.schema.ts',
    }

    const integrationTests = {
      sourceText: `// Generated by ts-to-effect-schema
      import * as S from "@effect/schema/Schema";
      import type { ReadonlyDeep } from "type-fest";

      import * as spec from "./${sourceTypes.relativePath.slice(0, -3)}";
      import * as generated from "./${effectSchemas.relativePath.slice(0, -3)}";

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      function expectType<T>(_: T) {
        /* noop */
      }

      export type CitizenInferredType = Partial<S.Schema.To<typeof generated.citizenSchema>>;

      expectType<CitizenInferredType>({} as spec.Citizen);
      expectType<ReadonlyDeep<spec.Citizen>>({} as CitizenInferredType);
  `,
      relativePath: 'source.integration.ts',
    }

    const errors = validateGeneratedTypes({
      sourceTypes,
      effectSchemas,
      integrationTests,
      skipParseJSDoc: true,
    })

    expect(errors).toEqual([])
  })
})

import { generate } from "./generate";

describe("generate", () => {
  describe("simple case", () => {
    const sourceText = `
      export type Name = "superman" | "clark kent" | "kal-l";

      // Note that the Superman is declared after
      export type BadassSuperman = Omit<Superman, "underKryptonite">;

      export interface Superman {
        name: Name;
        age: number;
        underKryptonite?: boolean;
        /**
         *  _@format email
         **/
        email: string;
      }

      const fly = () => console.log("I can fly!");
      `;

    const { getEffectSchemasFile, getIntegrationTestFile, errors } = generate({
      sourceText,
    });

    it("should generate the effect schemas", () => {
      expect(getEffectSchemasFile("./hero", sourceText)).toMatchInlineSnapshot(`
        "// Generated by ts-to-effect-schema
        import * as S from "@effect/schema/Schema";

        export const nameSchema = S.union(S.literal("superman"), S.literal("clark kent"), S.literal("kal-l"));

        export const supermanSchema = S.struct({
            name: nameSchema,
            age: S.number,
            underKryptonite: S.optional(S.boolean),
            email: S.string
        });

        export const badassSupermanSchema = supermanSchema.omit({ "underKryptonite": true });
        "
      `);
    });

    it("should generate the integration tests", () => {
      expect(getIntegrationTestFile("./hero", "hero.effect"))
        .toMatchInlineSnapshot(`
        "// Generated by ts-to-effect-schema
          import * as S from "@effect/schema/Schema";
          import type { ReadonlyDeep } from "type-fest";

        import * as spec from "./hero";
        import * as generated from "hero.effect";

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        function expectType<T>(_: T) {
          /* noop */
        }

        export type nameSchemaInferredType = S.To<typeof generated.nameSchema>;

        export type supermanSchemaInferredType = S.To<typeof generated.supermanSchema>;

        export type badassSupermanSchemaInferredType = S.To<typeof generated.badassSupermanSchema>;

        expectType<ReadonlyDeep<spec.Name>>({} as ReadonlyDeep<spec.Name>)
        expectType<ReadonlyDeep<spec.Name>>({} as ReadonlyDeep<spec.Name>)
        expectType<ReadonlyDeep<spec.Superman>>({} as ReadonlyDeep<spec.Superman>)
        expectType<ReadonlyDeep<spec.Superman>>({} as ReadonlyDeep<spec.Superman>)
        expectType<ReadonlyDeep<spec.BadassSuperman>>({} as ReadonlyDeep<spec.BadassSuperman>)
        expectType<ReadonlyDeep<spec.BadassSuperman>>({} as ReadonlyDeep<spec.BadassSuperman>)
        "
      `);
    });
    it("should not have any errors", () => {
      expect(errors.length).toBe(0);
    });
  });

  describe("with enums", () => {
    const sourceText = `
      export enum Superhero {
        Superman = "superman"
        ClarkKent = "clark-kent"
      };

      export type FavoriteSuperhero = {
        superhero: Superhero.Superman
      };
      `;

    const { getEffectSchemasFile, getIntegrationTestFile, errors } = generate({
      sourceText,
    });

    it("should generate the effect schemas", () => {
      expect(getEffectSchemasFile("./superhero", sourceText))
        .toMatchInlineSnapshot(`
        "// Generated by ts-to-effect-schema
        import * as S from "@effect/schema/Schema";
        import { Superhero } from "./superhero";

        export const superheroSchema = S.enums(Superhero);

        export const favoriteSuperheroSchema = S.struct({
            superhero: S.literal(Superhero.Superman)
        });
        "
      `);
    });

    it("should generate the integration tests", () => {
      expect(getIntegrationTestFile("./superhero", "superhero.effect"))
        .toMatchInlineSnapshot(`
        "// Generated by ts-to-effect-schema
          import * as S from "@effect/schema/Schema";
          import type { ReadonlyDeep } from "type-fest";

        import * as spec from "./superhero";
        import * as generated from "superhero.effect";

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        function expectType<T>(_: T) {
          /* noop */
        }

        export type superheroSchemaInferredType = S.To<typeof generated.superheroSchema>;

        export type favoriteSuperheroSchemaInferredType = S.To<typeof generated.favoriteSuperheroSchema>;

        expectType<ReadonlyDeep<spec.Superhero>>({} as ReadonlyDeep<spec.Superhero>)
        expectType<ReadonlyDeep<spec.Superhero>>({} as ReadonlyDeep<spec.Superhero>)
        expectType<ReadonlyDeep<spec.FavoriteSuperhero>>({} as ReadonlyDeep<spec.FavoriteSuperhero>)
        expectType<ReadonlyDeep<spec.FavoriteSuperhero>>({} as ReadonlyDeep<spec.FavoriteSuperhero>)
        "
      `);
    });

    it("should not have any errors", () => {
      expect(errors.length).toBe(0);
    });
  });

  describe("with circular references", () => {
    const sourceText = `
      export interface Villain {
        name: string;
        powers: string[];
        friends: Villain[];
      }

      export interface EvilPlan {
        owner: Villain;
        description: string;
        details: EvilPlanDetails;
      }

      export interface EvilPlanDetails {
        parent: EvilPlan;
        steps: string[];
      }

      export interface IHaveUnknownDependency {
        dep: UnknownDependency; // <- Missing dependency
      }
      `;

    const { getEffectSchemasFile, getIntegrationTestFile, errors } = generate({
      sourceText,
    });

    it("should generate the effect schemas", () => {
      expect(getEffectSchemasFile("./villain", sourceText))
        .toMatchInlineSnapshot(`
        "// Generated by ts-to-effect-schema
        import * as S from "@effect/schema/Schema";
        import type { Primitive, ReadonlyDeep, IsAny, IsUnknown } from "type-fest";import type { Villain, EvilPlan, EvilPlanDetails } from "./villain";

        // https://github.com/sindresorhus/type-fest/blob/2f64161921fc5e2d8e29d36ddaf2dc082017de35/source/internal.d.ts#L35
                export type BuiltIns = Primitive | Date | RegExp;

                export type ReplaceType<T, From, To> = IsAny<T> extends true
                ? IsAny<From> extends true
                  ? To
                  : T
                : IsUnknown<T> extends true
                ? IsUnknown<From> extends true
                  ? To
                  : T
                : T extends From
                ? To
                : T;

              export type ReplaceTypeDeep<T, From, To> = T extends BuiltIns
                ? ReplaceType<T, From, To>
                : IsAny<T> extends true
                ? ReplaceType<T, From, To>
                : IsUnknown<T> extends true
                ? ReplaceType<T, From, To>
                : {
                    [K in keyof T]: ReplaceTypeDeep<T[K], From, To>;
                  };

            export type ReplaceDateToStringDeep<T> = ReplaceTypeDeep<T, Date, string>;

            export type ObjectSchema<T extends Object> = S.Schema<
              ReplaceDateToStringDeep<ReadonlyDeep<T>>,
              ReadonlyDeep<T>
            >;

        export const villainSchema: ObjectSchema<Villain> = S.lazy(() => S.struct({
            name: S.string,
            powers: S.array(S.string),
            friends: S.array(villainSchema)
        }));

        export const evilPlanSchema: ObjectSchema<EvilPlan> = S.lazy(() => S.struct({
            owner: villainSchema,
            description: S.string,
            details: evilPlanDetailsSchema
        }));

        export const evilPlanDetailsSchema: ObjectSchema<EvilPlanDetails> = S.lazy(() => S.struct({
            parent: evilPlanSchema,
            steps: S.array(S.string)
        }));
        "
      `);
    });

    it("should generate the integration tests", () => {
      expect(getIntegrationTestFile("./villain", "villain.effect"))
        .toMatchInlineSnapshot(`
        "// Generated by ts-to-effect-schema
          import * as S from "@effect/schema/Schema";
          import type { ReadonlyDeep } from "type-fest";

        import * as spec from "./villain";
        import * as generated from "villain.effect";

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        function expectType<T>(_: T) {
          /* noop */
        }

        export type villainSchemaInferredType = S.To<typeof generated.villainSchema>;

        export type evilPlanSchemaInferredType = S.To<typeof generated.evilPlanSchema>;

        export type evilPlanDetailsSchemaInferredType = S.To<typeof generated.evilPlanDetailsSchema>;

        expectType<ReadonlyDeep<spec.Villain>>({} as ReadonlyDeep<spec.Villain>)
        expectType<ReadonlyDeep<spec.Villain>>({} as ReadonlyDeep<spec.Villain>)
        expectType<ReadonlyDeep<spec.EvilPlan>>({} as ReadonlyDeep<spec.EvilPlan>)
        expectType<ReadonlyDeep<spec.EvilPlan>>({} as ReadonlyDeep<spec.EvilPlan>)
        expectType<ReadonlyDeep<spec.EvilPlanDetails>>({} as ReadonlyDeep<spec.EvilPlanDetails>)
        expectType<ReadonlyDeep<spec.EvilPlanDetails>>({} as ReadonlyDeep<spec.EvilPlanDetails>)
        "
      `);
    });

    it("should have some errors", () => {
      expect(errors).toMatchInlineSnapshot(`
        [
          "Some schemas can't be generated due to direct or indirect missing dependencies:
        unknownDependencySchema
        iHaveUnknownDependencySchema",
        ]
      `);
    });
  });

  describe("with options", () => {
    const sourceText = `export interface Superman {
      /**
       * Name of superman
       */
      name: string;
    }

    export interface Villain {
      name: string;
      didKillSuperman: true;
    }
    `;

    const { getEffectSchemasFile } = generate({
      sourceText,
      nameFilter: (id) => id === "Superman",
      getSchemaName: (id) => id.toLowerCase(),
      keepComments: true,
    });

    it("should generate superman schema", () => {
      expect(getEffectSchemasFile("./hero", sourceText)).toMatchInlineSnapshot(`
        "// Generated by ts-to-effect-schema
        import * as S from "@effect/schema/Schema";

        export const superman = S.struct({
            /**
             * Name of superman
             */
            name: S.string
        });
        "
      `);
    });
  });

  describe("inheritance and reference type search", () => {
    const sourceText = `
    export type Name = "superman" | "clark kent" | "kal-l";
    export interface Superman {
      name: Name;
    }`;

    const { getEffectSchemasFile } = generate({
      sourceText,
      nameFilter: (id) => id === "Superman",
      getSchemaName: (id) => id.toLowerCase(),
      keepComments: true,
    });

    it("should generate superman schema", () => {
      expect(getEffectSchemasFile("./hero", sourceText)).toMatchInlineSnapshot(`
        "// Generated by ts-to-effect-schema
        import * as S from "@effect/schema/Schema";

        export const name = S.union(S.literal("superman"), S.literal("clark kent"), S.literal("kal-l"));

        export const superman = S.struct({
            name: name
        });
        "
      `);
    });
  });

  describe("with jsdocTags filter", () => {
    it("should generate only types with @effect", () => {
      const sourceText = `
      /**
       * @effect
       **/
      export type Name = "superman" | "clark kent" | "kal-l";

      /**
       * @nop
       */
      export type BadassSuperman = Omit<Superman, "underKryptonite">;

      /**
       * Only this interface should be generated
       *
       * @effect
       */
      export interface Superman {
        name: Name;
        age: number;
        underKryptonite?: boolean;
        /**
         * _@format email
         **/
        email: string;
      }
      `;

      const { getEffectSchemasFile } = generate({
        sourceText,
        jsDocTagFilter: (tags) =>
          tags.map((tag) => tag.name).includes("effect"),
      });

      expect(getEffectSchemasFile("./source", sourceText))
        .toMatchInlineSnapshot(`
        "// Generated by ts-to-effect-schema
        import * as S from "@effect/schema/Schema";

        export const nameSchema = S.union(S.literal("superman"), S.literal("clark kent"), S.literal("kal-l"));

        export const supermanSchema = S.struct({
            name: nameSchema,
            age: S.number,
            underKryptonite: S.optional(S.boolean),
            email: S.string
        });
        "
      `);
    });
  });

  describe("with non-exported types", () => {
    it("should generate tests for exported schemas", () => {
      const sourceText = `
      export type Name = "superman" | "clark kent" | "kal-l";

      // Note that the Superman is declared after
      export type BadassSuperman = Omit<Superman, "underKryptonite">;

      interface Superman {
        name: Name;
        age: number;
        underKryptonite?: boolean;
        /**
         * _@format email
         **/
        email: string;
      }
      `;

      const { getIntegrationTestFile } = generate({
        sourceText,
      });

      expect(getIntegrationTestFile("./source", "./source.effect"))
        .toMatchInlineSnapshot(`
        "// Generated by ts-to-effect-schema
          import * as S from "@effect/schema/Schema";
          import type { ReadonlyDeep } from "type-fest";

        import * as spec from "./source";
        import * as generated from "./source.effect";

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        function expectType<T>(_: T) {
          /* noop */
        }

        export type nameSchemaInferredType = S.To<typeof generated.nameSchema>;

        export type badassSupermanSchemaInferredType = S.To<typeof generated.badassSupermanSchema>;

        expectType<ReadonlyDeep<spec.Name>>({} as ReadonlyDeep<spec.Name>)
        expectType<ReadonlyDeep<spec.Name>>({} as ReadonlyDeep<spec.Name>)
        expectType<ReadonlyDeep<spec.BadassSuperman>>({} as ReadonlyDeep<spec.BadassSuperman>)
        expectType<ReadonlyDeep<spec.BadassSuperman>>({} as ReadonlyDeep<spec.BadassSuperman>)
        "
      `);
    });
  });

  describe("with namespace", () => {
    const sourceText = `
      export namespace Metropolis {
        export type Name = "superman" | "clark kent" | "kal-l";

        // Note that the Superman is declared after
        export type BadassSuperman = Omit<Superman, "underKryptonite">;

        export interface Superman {
          name: Name;
          age: number;
          underKryptonite?: boolean;
          /**
           * _@format email
           **/
          email: string;
        }

        const fly = () => console.log("I can fly!");
      }
      `;

    const { getEffectSchemasFile, getIntegrationTestFile, errors } = generate({
      sourceText,
    });

    it("should generate the effect schemas", () => {
      expect(getEffectSchemasFile("./hero", sourceText)).toMatchInlineSnapshot(`
        "// Generated by ts-to-effect-schema
        import * as S from "@effect/schema/Schema";

        export const metropolisNameSchema = S.union(S.literal("superman"), S.literal("clark kent"), S.literal("kal-l"));

        export const metropolisSupermanSchema = S.struct({
            name: metropolisNameSchema,
            age: S.number,
            underKryptonite: S.optional(S.boolean),
            email: S.string
        });

        export const metropolisBadassSupermanSchema = metropolisSupermanSchema.omit({ "underKryptonite": true });
        "
      `);
    });

    it("should generate the integration tests", () => {
      expect(getIntegrationTestFile("./hero", "hero.effect"))
        .toMatchInlineSnapshot(`
        "// Generated by ts-to-effect-schema
          import * as S from "@effect/schema/Schema";
          import type { ReadonlyDeep } from "type-fest";

        import * as spec from "./hero";
        import * as generated from "hero.effect";

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        function expectType<T>(_: T) {
          /* noop */
        }

        export type metropolisNameSchemaInferredType = S.To<typeof generated.metropolisNameSchema>;

        export type metropolisSupermanSchemaInferredType = S.To<typeof generated.metropolisSupermanSchema>;

        export type metropolisBadassSupermanSchemaInferredType = S.To<typeof generated.metropolisBadassSupermanSchema>;

        expectType<ReadonlyDeep<spec.MetropolisName>>({} as ReadonlyDeep<spec.MetropolisName>)
        expectType<ReadonlyDeep<spec.MetropolisName>>({} as ReadonlyDeep<spec.MetropolisName>)
        expectType<ReadonlyDeep<spec.MetropolisSuperman>>({} as ReadonlyDeep<spec.MetropolisSuperman>)
        expectType<ReadonlyDeep<spec.MetropolisSuperman>>({} as ReadonlyDeep<spec.MetropolisSuperman>)
        expectType<ReadonlyDeep<spec.MetropolisBadassSuperman>>({} as ReadonlyDeep<spec.MetropolisBadassSuperman>)
        expectType<ReadonlyDeep<spec.MetropolisBadassSuperman>>({} as ReadonlyDeep<spec.MetropolisBadassSuperman>)
        "
      `);
    });
    it("should not have any errors", () => {
      expect(errors).toEqual([]);
    });
  });
});

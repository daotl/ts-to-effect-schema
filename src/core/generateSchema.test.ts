import { camel } from 'case'
import ts from 'typescript'
import { findNode } from '../utils/findNode'
import { generateSchemaVariableStatement } from './generateSchema'

describe('generateSchema', () => {
  it('should generate a string schema', () => {
    const source = 'export type MyHeroName = string;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const myHeroNameSchema = S.string;"`,
    )
  })

  it('should generate a number schema', () => {
    const source = 'export type MyHeroAge = number;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const myHeroAgeSchema = S.number;"`,
    )
  })

  it('should generate an any schema', () => {
    const source = 'export type MyHeroPower = any;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const myHeroPowerSchema = S.any;"`,
    )
  })

  it('should generate a boolean schema', () => {
    const source = 'export type HavePower = boolean;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const havePowerSchema = S.boolean;"`,
    )
  })

  it('should generate an undefined schema', () => {
    const source = 'export type Nothing = undefined;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const nothingSchema = S.undefined;"`,
    )
  })

  it('should generate a null schema', () => {
    const source = 'export type MyHeroWeakness = null;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const myHeroWeaknessSchema = S.null;"`,
    )
  })

  it('should generate a void schema', () => {
    const source = 'export type MyEnemyChance = void;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const myEnemyChanceSchema = S.void;"`,
    )
  })

  it('should generate a bigint schema', () => {
    const source = 'export type loisLaneCapturedCount = bigint;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const loisLaneCapturedCountSchema = S.bigint;"`,
    )
  })

  it('should generate a date schema', () => {
    const source = 'export type lastIncidentInMetropolis = Date;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const lastIncidentInMetropolisSchema = S.Date;"`,
    )
  })

  it('should generate a literal schema (string)', () => {
    const source = `export type Kryptonite = "kryptonite";`
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const kryptoniteSchema = S.literal("kryptonite");"`,
    )
  })

  it('should generate a literal schema (number)', () => {
    const source = 'export type IdentitiesCount = 2;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const identitiesCountSchema = S.literal(2);"`,
    )
  })

  it('should generate a literal schema (true)', () => {
    const source = 'export type IsSuperman = true;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const isSupermanSchema = S.literal(true);"`,
    )
  })

  it('should generate a literal schema (false)', () => {
    const source = 'export type CanBeatEffect = false;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const canBeatEffectSchema = S.literal(false);"`,
    )
  })

  it('should generate a literal schema (enum)', () => {
    const source = `
    export type BestSuperhero = {
      superhero: Superhero.Superman
    };
    `
    expect(generate(source)).toMatchInlineSnapshot(`
      "export const bestSuperheroSchema = S.struct({
          superhero: S.literal(Superhero.Superman)
      });"
    `)
  })

  it('should generate a enums schema', () => {
    const source = `export enum Superhero = {
      Superman = "superman",
      ClarkKent = "clark_kent",
    };`
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const superheroSchema = S.enums(Superhero);"`,
    )
  })

  it('should generate a never', () => {
    const source = 'export type CanBeatEffect = never;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const canBeatEffectSchema = S.never;"`,
    )
  })

  it('should map unknown type correctly', () => {
    const source = 'export type T = unknown;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const tSchema = S.unknown;"`,
    )
  })

  it('should generate an array schema (T[] notation)', () => {
    const source = 'export type Villains = string[];'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const villainsSchema = S.array(S.string);"`,
    )
  })

  it('should generate an array schema (Array<T> notation)', () => {
    const source = 'export type Villains = Array<string>;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const villainsSchema = S.array(S.string);"`,
    )
  })

  it('should generate a tuple schema', () => {
    const source = 'export type Life = [LoisLane, Problem[]];'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const lifeSchema = S.tuple(loisLaneSchema, S.array(problemSchema));"`,
    )
  })

  it('should generate a tuple schema (named)', () => {
    const source = 'export type Story = [subject: string, problems: string[]];'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const storySchema = S.tuple(S.string, S.array(S.string));"`,
    )
  })

  it('should generate an object schema', () => {
    const source = `export type Superman = {
     name: "superman";
     weakness: Kryptonite;
     age: number;
     enemies: Array<string>;
   };`
    expect(generate(source)).toMatchInlineSnapshot(`
      "export const supermanSchema = S.struct({
          name: S.literal("superman"),
          weakness: kryptoniteSchema,
          age: S.number,
          enemies: S.array(S.string)
      });"
    `)
  })

  it('should generate a numerical key', () => {
    const source = `export type responses = {
     200: {
      content: {
        "application/json": {
          id: string
        }
      }
     }
   };`

    expect(generate(source)).toMatchInlineSnapshot(`
      "export const responsesSchema = S.struct({
          200: S.struct({
              content: S.struct({
                  "application/json": S.struct({
                      id: S.string
                  })
              })
          })
      });"
    `)
  })

  // it('should generate a promise schema', () => {
  //   const source = 'export type KrytonResponse = Promise<boolean>'
  //   expect(generate(source)).toMatchInlineSnapshot(
  //     `"export const krytonResponseSchema = z.promise(S.boolean);"`,
  //   )
  // })

  it('should generate a referenced schema', () => {
    const source = 'export type Villain = BadGuy;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const villainSchema = badGuySchema;"`,
    )
  })

  it('should generate a union schema', () => {
    const source = `export type Identity = "superman" | "clark kent";`
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const identitySchema = S.union(S.literal("superman"), S.literal("clark kent"));"`,
    )
  })

  it('should generate a literal schema for a single union', () => {
    const source = `export type Identity = | "superman";`
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const identitySchema = S.literal("superman");"`,
    )
  })

  it('should generate two joined schemas', () => {
    const source =
      'export type SupermanWithWeakness = Superman & { weakness: Kryptonite };'
    expect(generate(source)).toMatchInlineSnapshot(`
      "export const supermanWithWeaknessSchema = supermanSchema.pipe(S.extend(omitCommonProperties(S.to(S.struct({
          weakness: kryptoniteSchema
      })), S.to(supermanSchema))));"
    `)
  })

  it('should generate a record schema', () => {
    const source = 'export type EnemiesPowers = Record<string, Power>;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const enemiesPowersSchema = S.record(S.string, powerSchema);"`,
    )
  })

  it('should generate a set schema', () => {
    const source = 'export type EnemiesPowers = Set<string>;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const enemiesPowersSchema = S.set(S.string);"`,
    )
  })

  // it('should generate a function schema', () => {
  //   const source =
  //     'export type KillSuperman = (withKryptonite: boolean, method: string) => Promise<boolean>;'
  //   expect(generate(source)).toMatchInlineSnapshot(
  //     `"export const killSupermanSchema = z.function().args(S.boolean, S.string).returns(z.promise(S.boolean));"`,
  //   )
  // })

  // it('should generate a function with optional parameter', () => {
  //   const source = `export type GetSupermanSkill = (
  //     key: string,
  //     params?: Record<string, string | number>
  //   ) => string`

  //   expect(generate(source)).toMatchInlineSnapshot(
  //     `"export const getSupermanSkillSchema = z.function().args(S.string, z.record(z.union([S.string, S.number])).optional()).returns(S.string);"`,
  //   )
  // })

  // it('should generate a function schema (with `any` fallback on param)', () => {
  //   const source =
  //     'export type KillSuperman = (withKryptonite: boolean, method) => Promise<boolean>;'
  //   expect(generate(source)).toMatchInlineSnapshot(
  //     `"export const killSupermanSchema = z.function().args(S.boolean, S.any).returns(z.promise(S.boolean));"`,
  //   )
  // })

  it('should throw on non string record', () => {
    const source = 'export type UnsupportedType = Record<number, number>;'
    expect(() => generate(source)).toThrowErrorMatchingInlineSnapshot(
      `"Record<number, …> are not supported (https://github.com/effect-ts/schema#records)"`,
    )
  })

  it('should throw on not supported key in omit', () => {
    const source = 'export type UnsupportedType = Omit<Superman, Krytonite>;'
    expect(() => generate(source)).toThrowErrorMatchingInlineSnapshot(
      `"Omit<T, K> unknown syntax: (TypeReference as K not supported)"`,
    )
  })

  it('should throw on not supported interface with extends and index signature', () => {
    const source = `export interface Superman extends Clark {
     [key: string]: any;
   };`

    expect(() => generate(source)).toThrowErrorMatchingInlineSnapshot(
      `"interface with \`extends\` and index signature are not supported!"`,
    )
  })

  it('should throw on not supported key in omit (union)', () => {
    const source =
      'export type UnsupportedType = Omit<Superman, Krytonite | LoisLane>;'
    expect(() => generate(source)).toThrowErrorMatchingInlineSnapshot(
      `"Omit<T, K> unknown syntax: (TypeReference as K union part not supported)"`,
    )
  })

  it('should throw on not supported key in pick', () => {
    const source = 'export type UnsupportedType = Pick<Superman, Krytonite>;'
    expect(() => generate(source)).toThrowErrorMatchingInlineSnapshot(
      `"Pick<T, K> unknown syntax: (TypeReference as K not supported)"`,
    )
  })

  it('should throw on not supported key in pick (union)', () => {
    const source =
      'export type UnsupportedType = Pick<Superman, Krytonite | LoisLane>;'
    expect(() => generate(source)).toThrowErrorMatchingInlineSnapshot(
      `"Pick<T, K> unknown syntax: (TypeReference as K union part not supported)"`,
    )
  })

  it('should fallback on the original type for Readonly<T>', () => {
    const source = 'export type ReadonlySuperman = Readonly<Superman>;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const readonlySupermanSchema = supermanSchema;"`,
    )
  })

  it('should fallback on Array for ReadonlyArray<T>', () => {
    const source = 'export type ReadonlySupermen = ReadonlyArray<Superman>;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const readonlySupermenSchema = S.array(supermanSchema);"`,
    )
  })

  it('should generate a partial schema', () => {
    const source = 'export type SupermanUnderKryptonite = Partial<Hero>;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const supermanUnderKryptoniteSchema = S.partial(heroSchema);"`,
    )
  })

  it('should generate a required schema', () => {
    const source = 'export type IDidFindYou = Required<VillainLocation>;'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const iDidFindYouSchema = S.required(villainLocationSchema);"`,
    )
  })

  it('should generate a schema with omit', () => {
    const source = `export type InvincibleSuperman = Omit<Superman, "weakness">;`
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const invincibleSupermanSchema = supermanSchema.omit({ "weakness": true });"`,
    )
  })

  it('should generate a schema with omit (multiple keys)', () => {
    const source = `export type VeryInvincibleSuperman = Omit<Superman, "weakness" | "wife">;`
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const veryInvincibleSupermanSchema = supermanSchema.omit({ "weakness": true, "wife": true });"`,
    )
  })

  it('should generate a schema with pick', () => {
    const source = `export type YouJustKnowMyName = Pick<SecretIdentity, "name">;`
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const youJustKnowMyNameSchema = secretIdentitySchema.pick({ "name": true });"`,
    )
  })

  it('should generate a schema with pick (multiple keys)', () => {
    const source = `export type YouKnowTooMuch = Pick<SecretIdentity, "name" | "location">;`
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const youKnowTooMuchSchema = secretIdentitySchema.pick({ "name": true, "location": true });"`,
    )
  })

  it('should generate a complex schema from an interface', () => {
    const source = `export interface Superman {
     name: "superman" | "clark kent" | "kal-l";
     enemies: Record<string, Enemy>;
     age: number;
     underKryptonite?: boolean;
     needGlasses: true | null;
   };`
    expect(generate(source)).toMatchInlineSnapshot(`
      "export const supermanSchema = S.struct({
          name: S.union(S.literal("superman"), S.literal("clark kent"), S.literal("kal-l")),
          enemies: S.record(S.string, enemySchema),
          age: S.number,
          underKryptonite: S.optional(S.boolean),
          needGlasses: S.nullable(S.literal(true))
      });"
    `)
  })

  it('should generate an extended schema', () => {
    const source = `export interface Superman extends Clark {
     withPower: boolean;
   }`
    expect(generate(source)).toMatchInlineSnapshot(`
      "export const supermanSchema = clarkSchema.pipe(S.extend(omitCommonProperties(S.to(S.struct({
          withPower: S.boolean
      })), S.to(clarkSchema))));"
    `)
  })

  it('should generate an variable assignment if an extending type has no new fields', () => {
    const source = 'export interface Superman extends Clark {}'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const supermanSchema = clarkSchema;"`,
    )
  })

  it('should generate a merged schema when two extends are used', () => {
    const source = `export interface Superman extends Clark extends KalL {
        withPower: boolean;
     };`

    expect(generate(source)).toMatchInlineSnapshot(`
      "export const supermanSchema = clarkSchema.pipe(S.extend(omitCommonProperties(S.to(kalLSchema), S.to(clarkSchema)))).pipe(S.extend(omitCommonProperties(S.to(S.struct({
          withPower: S.boolean
      })), S.to(clarkSchema.pipe(S.extend(omitCommonProperties(S.to(kalLSchema), S.to(clarkSchema))))))));"
    `)
  })

  it('should generate a merged schema when extending with two comma-separated interfaces', () => {
    const source = `export interface Superman extends Clark, KalL {
        withPower: boolean;
     };`

    expect(generate(source)).toMatchInlineSnapshot(`
      "export const supermanSchema = clarkSchema.pipe(S.extend(omitCommonProperties(S.to(kalLSchema), S.to(clarkSchema)))).pipe(S.extend(omitCommonProperties(S.to(S.struct({
          withPower: S.boolean
      })), S.to(clarkSchema.pipe(S.extend(omitCommonProperties(S.to(kalLSchema), S.to(clarkSchema))))))));"
    `)
  })

  it('should generate a merged schema when extending with multiple comma-separated interfaces', () => {
    const source = `export interface Superman extends Clark, KalL, Kryptonian {
        withPower: boolean;
     };`

    expect(generate(source)).toMatchInlineSnapshot(`
      "export const supermanSchema = clarkSchema.pipe(S.extend(omitCommonProperties(S.to(kalLSchema), S.to(clarkSchema)))).pipe(S.extend(omitCommonProperties(S.to(kryptonianSchema), S.to(clarkSchema.pipe(S.extend(omitCommonProperties(S.to(kalLSchema), S.to(clarkSchema)))))))).pipe(S.extend(omitCommonProperties(S.to(S.struct({
          withPower: S.boolean
      })), S.to(clarkSchema.pipe(S.extend(omitCommonProperties(S.to(kalLSchema), S.to(clarkSchema)))).pipe(S.extend(omitCommonProperties(S.to(kryptonianSchema), S.to(clarkSchema.pipe(S.extend(omitCommonProperties(S.to(kalLSchema), S.to(clarkSchema))))))))))));"
    `)
  })

  it('should deal with literal keys', () => {
    const source = `export interface Villain {
     "i.will.kill.everybody": true;
   };`
    expect(generate(source)).toMatchInlineSnapshot(`
      "export const villainSchema = S.struct({
          "i.will.kill.everybody": S.literal(true)
      });"
    `)
  })

  it('should deal with index access type (1st level)', () => {
    const source = `export type SupermanName = Superman["name"]`

    expect(generate(source)).toMatchInlineSnapshot(
      `"export const supermanNameSchema = getPropertySchemas(S.to(supermanSchema)).name;"`,
    )
  })

  it('should deal with index access type (nested level)', () => {
    const source = `export type SupermanFlyPower = Superman["power"]["fly"]`

    expect(generate(source)).toMatchInlineSnapshot(
      `"export const supermanFlyPowerSchema = getPropertySchemas(S.to(getPropertySchemas(S.to(supermanSchema)).power)).fly;"`,
    )
  })

  it('should deal with index access type (array item)', () => {
    const source = `export type SupermanPower = Superman["powers"][-1];

    export type Superman = {
      powers: Array<Power>
    };`

    expect(generate(source)).toMatchInlineSnapshot(
      `"export const supermanPowerSchema = getPropertySchemas(S.to(getPropertySchemas(S.to(supermanSchema)).powers)).element;"`,
    )
  })

  it('should deal with index access type (array item bis)', () => {
    const source = `export type SupermanPower = Superman["powers"][-1];

    export type Superman = {
      powers: Power[]
    };`

    expect(generate(source)).toMatchInlineSnapshot(
      `"export const supermanPowerSchema = getPropertySchemas(S.to(getPropertySchemas(S.to(supermanSchema)).powers)).element;"`,
    )
  })

  it('should deal with index access type (record item)', () => {
    const source = `export type SupermanPower = Superman["powers"][-1];

    export type Superman = {
      powers: Record<string, Power>
    };`

    expect(generate(source)).toMatchInlineSnapshot(
      `"export const supermanPowerSchema = getPropertySchemas(S.to(supermanSchema)).powers;"`,
    )
  })

  it('should deal with index access type (record item) (interface)', () => {
    const source = `export type SupermanPower = Superman["powers"][-1];

    export interface Superman {
      powers: Record<string, Power>
    };`

    expect(generate(source)).toMatchInlineSnapshot(
      `"export const supermanPowerSchema = getPropertySchemas(S.to(supermanSchema)).powers;"`,
    )
  })

  it('should deal with index access type (tuple)', () => {
    const source = `export type SupermanPower = Superman["powers"][1];

    export type Superman = {
      powers: ["fly", "burnStuff"]
    };`

    expect(generate(source)).toMatchInlineSnapshot(
      `"export const supermanPowerSchema = getPropertySchemas(S.to(getPropertySchemas(S.to(supermanSchema)).powers)).[1];"`,
    )
  })

  // TODO
  it.skip('should deal with index access type (nested array item)', () => {
    const source = `export type SupermanPower = Superman["powers"][-1][-1];

    export type Superman = {
      powers: Power[][]
    };`

    expect(generate(source)).toMatchInlineSnapshot(
      `"export const supermanPowerSchema = supermanSchema.shape.powers.element.element;"`,
    )
  })

  it('should deal with index access type (inline array item)', () => {
    const source = `export type SupermanPower = Superman["powers"][-1];

    export type Superman = {
      powers: Array<{type: string}>
    };`

    expect(generate(source)).toMatchInlineSnapshot(
      `"export const supermanPowerSchema = getPropertySchemas(S.to(getPropertySchemas(S.to(supermanSchema)).powers)).element;"`,
    )
  })

  it('should deal with index access type (inline array item bis)', () => {
    const source = `export type SupermanPower = Superman["powers"][-1];

    export type Superman = {
      powers: {type: string}[]
    };`

    expect(generate(source)).toMatchInlineSnapshot(
      `"export const supermanPowerSchema = getPropertySchemas(S.to(getPropertySchemas(S.to(supermanSchema)).powers)).element;"`,
    )
  })

  it('should deal with index access type (inline record)', () => {
    const source = `export type SupermanPower = Superman["powers"][-1];

    export type Superman = {
      powers: Record<string, {type: string}>
    };`

    expect(generate(source)).toMatchInlineSnapshot(
      `"export const supermanPowerSchema = getPropertySchemas(S.to(supermanSchema)).powers;"`,
    )
  })

  it('should deal with parenthesized type', () => {
    const source = 'export type SecretVillain = (NormalGuy | Villain);'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const secretVillainSchema = S.union(normalGuySchema, villainSchema);"`,
    )
  })

  it('should deal with index signature', () => {
    const source = 'export type Movies = {[title: string]: Movie};'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const moviesSchema = S.record(S.string, movieSchema);"`,
    )
  })

  it('should deal with composed index signature', () => {
    const source = `export type Movies = {
      "Man of Steel": Movie & {title: "Man of Steel"};
      [title: string]: Movie;
    };`
    expect(generate(source)).toMatchInlineSnapshot(`
      "export const moviesSchema = S.record(S.string, movieSchema).and(S.struct({
          "Man of Steel": movieSchema.pipe(S.extend(omitCommonProperties(S.to(S.struct({
              title: S.literal("Man of Steel")
          })), S.to(movieSchema))))
      }));"
    `)
  })

  it('should deal with optional index signature', () => {
    const source = `export interface Collection {
      movies?: {[title: string] : Movie}
    }`
    expect(generate(source)).toMatchInlineSnapshot(`
      "export const collectionSchema = S.struct({
          movies: S.optional(S.record(S.string, movieSchema))
      });"
    `)
  })

  it('should deal with optional array', () => {
    const source = `export interface Collection {
      movies?: Array<string>
    }`
    expect(generate(source)).toMatchInlineSnapshot(`
      "export const collectionSchema = S.struct({
          movies: S.optional(S.array(S.string))
      });"
    `)
  })

  it('should generate an empty object schema', () => {
    const source = 'export type Empty = {};'
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const emptySchema = S.struct({});"`,
    )
  })

  it('should generate custom validators based on jsdoc tags', () => {
    const source = `export interface HeroContact {
      /**
       * The email of the hero.
       *
       * @format email
       */
      email: string;

      /**
       * The name of the hero.
       *
       * @minLength 2
       * @maxLength 50
       */
      name: string;

      /**
       * The phone number of the hero.
       *
       * @pattern ^([+]?d{1,2}[-s]?|)d{3}[-s]?d{3}[-s]?d{4}$
       */
      phoneNumber: string;

      /**
       * Does the hero has super power?
       *
       * @default true
       */
      hasSuperPower?: boolean;

      /**
       * The age of the hero
       *
       * @minimum 0
       * @maximum 500
       */
      age: number;
    }`
    expect(generate(source)).toMatchInlineSnapshot(`
      "export const heroContactSchema = S.struct({
          /**
           * The email of the hero.
           *
           * @format email
           */
          email: S.email(S.string),
          /**
           * The name of the hero.
           *
           * @minLength 2
           * @maxLength 50
           */
          name: S.string.pipe(S.minLength(2)).pipe(S.maxLength(50)),
          /**
           * The phone number of the hero.
           *
           * @pattern ^([+]?d{1,2}[-s]?|)d{3}[-s]?d{3}[-s]?d{4}$
           */
          phoneNumber: S.string.pipe(S.pattern(/^([+]?d{1,2}[-s]?|)d{3}[-s]?d{3}[-s]?d{4}$/)),
          /**
           * Does the hero has super power?
           *
           * @default true
           */
          hasSuperPower: S.optional(S.boolean).withDefault(() => true),
          /**
           * The age of the hero
           *
           * @minimum 0
           * @maximum 500
           */
          age: S.number.pipe(S.greaterThanOrEqualTo(0)).pipe(S.lessThanOrEqualTo(500))
      });"
    `)
  })

  it('should generate custom error message for `format` tag', () => {
    const source = `export interface HeroContact {
      /**
       * The email of the hero.
       *
       * @format email Should be an email
       */
      heroEmail: string;

      /**
       * The email of the enemy.
       *
       * @format email, "Should be an email"
       */
      enemyEmail: string;

      /**
       * The email of the superman.
       *
       * @format email "Should be an email"
       */
      supermanEmail: string;
    }`
    expect(generate(source)).toMatchInlineSnapshot(`
      "export const heroContactSchema = S.struct({
          /**
           * The email of the hero.
           *
           * @format email Should be an email
           */
          heroEmail: S.string.pipe(S.email("Should be an email")),
          /**
           * The email of the enemy.
           *
           * @format email, "Should be an email"
           */
          enemyEmail: S.string.pipe(S.email("Should be an email")),
          /**
           * The email of the superman.
           *
           * @format email "Should be an email"
           */
          supermanEmail: S.string.pipe(S.email("Should be an email"))
      });"
    `)
  })

  it('should generate custom error message based on jsdoc tags', () => {
    const source = `export interface HeroContact {
      /**
       * The email of the hero.
       *
       * @format email should be an email
       */
      email: string;

      /**
       * The name of the hero.
       *
       * @minLength 2, should be more than 2
       * @maxLength 50 should be less than 50
       */
      name: string;

      /**
       * The age of the hero
       *
       * @minimum 0 you are too young
       * @maximum 500, "you are too old"
       */
      age: number;
    }`
    expect(generate(source)).toMatchInlineSnapshot(`
      "export const heroContactSchema = S.struct({
          /**
           * The email of the hero.
           *
           * @format email should be an email
           */
          email: S.string.pipe(S.email("should be an email")),
          /**
           * The name of the hero.
           *
           * @minLength 2, should be more than 2
           * @maxLength 50 should be less than 50
           */
          name: S.string.pipe(S.minLength(2, "should be more than 2")).pipe(S.maxLength(50, "should be less than 50")),
          /**
           * The age of the hero
           *
           * @minimum 0 you are too young
           * @maximum 500, "you are too old"
           */
          age: S.number.pipe(S.greaterThanOrEqualTo(0, "you are too young")).pipe(S.lessThanOrEqualTo(500, "you are too old"))
      });"
    `)
  })

  it('should generate validator on top-level types', () => {
    const source = `/**
    * @minLength 1
    */
    export type NonEmptyString = string;`

    expect(generate(source)).toMatchInlineSnapshot(`
      "/**
          * @minLength 1
          */
      export const nonEmptyStringSchema = S.string.pipe(S.minLength(1));"
    `)
  })

  it('should deal with nullable', () => {
    const source = `export interface A {
      /** @minimum 0 */
      a: number | null;
      /** @minLength 1 */
      b: string | null;
      /** @pattern ^c$ */
      c: string | null;
    }
    `

    expect(generate(source)).toMatchInlineSnapshot(`
      "export const aSchema = S.struct({
          /** @minimum 0 */
          a: S.nullable(S.number.pipe(S.greaterThanOrEqualTo(0))),
          /** @minLength 1 */
          b: S.nullable(S.string.pipe(S.minLength(1))),
          /** @pattern ^c$ */
          c: S.nullable(S.string.pipe(S.pattern(/^c$/)))
      });"
    `)
  })

  it('should allow nullable on optional properties', () => {
    const source = `export interface A {
      a?: number | null;
    }
    `

    expect(generate(source)).toMatchInlineSnapshot(`
      "export const aSchema = S.struct({
          a: S.optional(S.nullable(S.number))
      });"
    `)
  })

  it('should deal with array of null or null', () => {
    const source = `export type Example = {
        field?: Array<string | null> | null
    }`

    expect(generate(source)).toMatchInlineSnapshot(`
      "export const exampleSchema = S.struct({
          field: S.optional(S.nullable(S.array(S.nullable(S.string))))
      });"
    `)
  })

  it('should deal with partial or null', () => {
    const source = `export type Example = {
        field: Partial<{foo: string}> | null
    }`

    expect(generate(source)).toMatchInlineSnapshot(`
      "export const exampleSchema = S.struct({
          field: S.partial(S.nullable(S.struct({
              foo: S.string
          })))
      });"
    `)
  })

  it('should deal with ReadonlyArray or null', () => {
    const source = `export type Example = {
        field: ReadonlyArray<"foo" | "bar"> | null
    }`

    expect(generate(source)).toMatchInlineSnapshot(`
      "export const exampleSchema = S.struct({
          field: S.nullable(S.array(S.union(S.literal("foo"), S.literal("bar"))))
      });"
    `)
  })

  it('should deal with Record or null', () => {
    const source = `export type Example = {
        field: Record<string, string> | null
    }`

    expect(generate(source)).toMatchInlineSnapshot(`
      "export const exampleSchema = S.struct({
          field: S.nullable(S.record(S.string, S.string))
      });"
    `)
  })

  it('should allow nullable on union properties', () => {
    const source = `export interface A {
      a: number | string | null;
    }
    `

    expect(generate(source)).toMatchInlineSnapshot(`
      "export const aSchema = S.struct({
          a: S.nullable(S.union(S.number, S.string))
      });"
    `)
  })

  it('should allow nullable on optional union properties', () => {
    const source = `export interface A {
      a?: number | string | null;
    }
    `

    expect(generate(source)).toMatchInlineSnapshot(`
      "export const aSchema = S.struct({
          a: S.nullable(S.optional(S.union(S.number, S.string)))
      });"
    `)
  })

  it('should deal with @default with all types', () => {
    const source = `export interface WithDefaults {
     /**
      * @default 42
      */
      theAnswerToTheUltimateQuestionOfLife: number;
      /**
       * @default false
       */
      isVulnerable: boolean;
      /**
       * @default clark
       */
      name: "clark" | "superman" | "kal-l";
      /**
       * @default The Answer to the Ultimate Question of Life
       */
      theMeaningOf42: string;
      /**
       * @default ""
       */
      emptyString: string;
      /**
       * @default "true"
       */
      booleanAsString: string;
   }`
    expect(generate(source)).toMatchInlineSnapshot(`
      "export const withDefaultsSchema = S.struct({
          /**
           * @default 42
           */
          theAnswerToTheUltimateQuestionOfLife: S.optional(S.number).withDefault(() => 42),
          /**
           * @default false
           */
          isVulnerable: S.optional(S.boolean).withDefault(() => false),
          /**
           * @default clark
           */
          name: S.optional(S.union(S.literal("clark"), S.literal("superman"), S.literal("kal-l"))).withDefault(() => 'clark'),
          /**
           * @default The Answer to the Ultimate Question of Life
           */
          theMeaningOf42: S.optional(S.string).withDefault(() => 'The Answer to the Ultimate Question of Life'),
          /**
           * @default ""
           */
          emptyString: S.optional(S.string).withDefault(() => ''),
          /**
           * @default "true"
           */
          booleanAsString: S.optional(S.string).withDefault(() => 'true')
      });"
    `)
  })

  it('should ignore unknown/broken jsdoc format', () => {
    const source = `export interface Hero {
     /**
      * @secret
      * @format
      * @pattern
      */
     secretIdentity: string;
     /**
      * @maximum infinity
      */
     age: number;
     /**
      * My super power
      */
     power: Power;
   };`

    expect(generate(source)).toMatchInlineSnapshot(`
      "export const heroSchema = S.struct({
          /**
           * @secret
           * @format
           * @pattern
           */
          secretIdentity: S.string,
          /**
           * @maximum infinity
           */
          age: S.number,
          /**
           * My super power
           */
          power: powerSchema
      });"
    `)
  })

  it('should throw on generics', () => {
    const source = `export interface Villain<TPower> {
     powers: TPower[]
   }`
    expect(() => generate(source)).toThrowErrorMatchingInlineSnapshot(
      `"Interface with generics are not supported!"`,
    )
  })

  it('should throw on interface with generics', () => {
    const source = `export interface Villain<TPower> {
     powers: TPower[]
   }`
    expect(() => generate(source)).toThrowErrorMatchingInlineSnapshot(
      `"Interface with generics are not supported!"`,
    )
  })

  it('should throw on type with generics', () => {
    const source = 'export type SecretVillain<T> = RandomPeople<T>'
    expect(() => generate(source)).toThrowErrorMatchingInlineSnapshot(
      `"Type with generics are not supported!"`,
    )
  })

  it('should be able to override the effect import value', () => {
    const source = 'export type TheLastTest = true'

    expect(generate(source, 'effect')).toMatchInlineSnapshot(
      `"export const theLastTestSchema = effect.literal(true);"`,
    )
  })

  it('should not generate any effect validation if `skipParseJSDoc` is `true`', () => {
    const source = `export interface A {
      /** @minimum 0 */
      a: number | null;
      /** @minLength 1 */
      b: string | null;
      /** @pattern ^c$ */
      c: string | null;
    }`

    expect(generate(source, 'S', true)).toMatchInlineSnapshot(`
      "export const aSchema = S.struct({
          /** @minimum 0 */
          a: S.nullable(S.number),
          /** @minLength 1 */
          b: S.nullable(S.string),
          /** @pattern ^c$ */
          c: S.nullable(S.string)
      });"
    `)
  })
})

/**
 * Wrapper to generate a effect schema from a string.
 *
 * @param sourceText Typescript interface or type
 * @returns Generated Effect schema
 */
function generate(sourceText: string, z?: string, skipParseJSDoc?: boolean) {
  const sourceFile = ts.createSourceFile(
    'index.ts',
    sourceText,
    ts.ScriptTarget.Latest,
  )
  const declaration = findNode(
    sourceFile,
    (
      node,
    ): node is
      | ts.InterfaceDeclaration
      | ts.TypeAliasDeclaration
      | ts.EnumDeclaration =>
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isEnumDeclaration(node),
  )
  if (!declaration) {
    throw new Error('No `type` or `interface` found!')
  }
  const interfaceName = declaration.name.text
  const effectConstName = `${camel(interfaceName)}Schema`

  const effectSchema = generateSchemaVariableStatement({
    schemaImportValue: z,
    node: declaration,
    sourceFile,
    varName: effectConstName,
    skipParseJSDoc,
  })
  return ts
    .createPrinter({ newLine: ts.NewLineKind.LineFeed })
    .printNode(ts.EmitHint.Unspecified, effectSchema.statement, sourceFile)
}

// Generated by ts-to-effect-schema
import * as S from '@effect/schema/Schema'
import type { ReadonlyDeep } from 'type-fest'
import { pipe } from '@effect/data/Function'
import type { Villain, EvilPlan, EvilPlanDetails } from './heros'
import { EnemyPower } from './heros'

type BuiltIns =
  | null
  | undefined
  | string
  | number
  | boolean
  | symbol
  | bigint
  | Date
  | RegExp

type ReplaceType<ValueType, FromType, ToType> = ValueType extends FromType
  ? ToType
  : ValueType

type ReplaceTypeDeep<ValueType, FromType, ToType> = ValueType extends BuiltIns
  ? ReplaceType<ValueType, FromType, ToType>
  : {
      [KeyType in keyof ValueType]: ReplaceTypeDeep<
        ValueType[KeyType],
        FromType,
        ToType
      >
    }

export const enemyPowerSchema = S.enums(EnemyPower)

export const skillsSpeedEnemySchema = S.struct({
  power: S.literal(EnemyPower.Speed),
})

export const enemySchema = S.struct({
  name: S.string,
  powers: S.array(enemyPowerSchema),
  inPrison: S.boolean,
})

export const supermanSchema = S.struct({
  name: S.union(
    S.literal('superman'),
    S.literal('clark kent'),
    S.literal('kal-l'),
  ),
  enemies: S.record(S.string, enemySchema),
  age: S.number,
  underKryptonite: S.optional(S.boolean),
  powers: S.tuple(
    S.literal('fly'),
    S.literal('laser'),
    S.literal('invincible'),
  ),
})

export const villainSchema: S.Schema<
  ReplaceTypeDeep<ReadonlyDeep<Villain>, Date, string>,
  ReadonlyDeep<Villain>
> = S.lazy(() =>
  S.struct({
    name: S.string,
    powers: S.array(enemyPowerSchema),
    friends: S.array(villainSchema),
    canBeTrusted: S.never,
  }),
)

export const storySchema = S.tuple(S.string, S.array(S.string))

export const withDefaultsSchema = S.struct({
  theAnswerToTheUltimateQuestionOfLife: S.optional(S.number).withDefault(
    () => 42,
  ),
  isVulnerable: S.optional(S.boolean).withDefault(() => false),
  name: S.optional(
    S.union(S.literal('clark'), S.literal('superman'), S.literal('kal-l')),
  ).withDefault(() => 'clark'),
  theMeaningOf42: S.optional(S.string).withDefault(
    () => 'The Answer to the Ultimate Question of Life',
  ),
  emptyString: S.optional(S.string).withDefault(() => ''),
  booleanAsString: S.optional(S.string).withDefault(() => 'true'),
})

const nonExportedSchema = S.struct({
  name: S.string,
})

export const exportedSchema = S.struct({
  a: nonExportedSchema,
  b: S.string,
})

export const heroContactSchema = S.struct({
  email: S.string,
  name: pipe(S.string, S.minLength(2), S.maxLength(50)),
  phoneNumber: pipe(
    S.string,
    S.pattern(/^([+]?d{1,2}[-s]?|)d{3}[-s]?d{3}[-s]?d{4}$/),
  ),
  hasSuperPower: S.optional(S.boolean).withDefault(() => true),
  age: pipe(S.number, S.lessThan(0), S.greaterThan(500)),
})

export const supermanEnemySchema =
  S.getPropertySignatures(supermanSchema).enemies

export const supermanNameSchema = S.getPropertySignatures(supermanSchema).name

export const supermanInvinciblePowerSchema = S.getPropertySignatures(
  S.getPropertySignatures(supermanSchema).powers,
)[2]

export const evilPlanSchema: S.Schema<
  ReplaceTypeDeep<ReadonlyDeep<EvilPlan>, Date, string>,
  ReadonlyDeep<EvilPlan>
> = S.lazy(() =>
  S.struct({
    owner: villainSchema,
    description: S.string,
    details: evilPlanDetailsSchema,
  }),
)

export const evilPlanDetailsSchema: S.Schema<
  ReplaceTypeDeep<ReadonlyDeep<EvilPlanDetails>, Date, string>,
  ReadonlyDeep<EvilPlanDetails>
> = S.lazy(() =>
  S.struct({
    parent: evilPlanSchema,
    steps: S.array(S.string),
  }),
)

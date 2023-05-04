// Generated by ts-to-effect-schema
import * as S from "@effect/schema/Schema";
import type { Primitive, ReadonlyDeep, IsAny, IsUnknown } from "type-fest";
import { pipe } from "@effect/data/Function";
import type { Villain, EvilPlan, EvilPlanDetails } from "./heros";
import { EnemyPower } from "./heros";

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

export const enemyPowerSchema = S.enums(EnemyPower);

export const skillsSpeedEnemySchema = S.struct({
  power: S.literal(EnemyPower.Speed),
});

export const enemySchema = S.struct({
  name: S.string,
  powers: S.array(enemyPowerSchema),
  inPrison: S.boolean,
});

export const supermanSchema = S.struct({
  name: S.union(
    S.literal("superman"),
    S.literal("clark kent"),
    S.literal("kal-l")
  ),
  enemies: S.record(S.string, enemySchema),
  age: S.number,
  underKryptonite: S.optional(S.boolean),
  powers: S.tuple(
    S.literal("fly"),
    S.literal("laser"),
    S.literal("invincible")
  ),
});

export const villainSchema: ObjectSchema<Villain> = S.lazy(() =>
  S.struct({
    name: S.string,
    powers: S.array(enemyPowerSchema),
    friends: S.array(villainSchema),
    canBeTrusted: S.never,
    age: S.unknown,
  })
);

export const storySchema = S.tuple(S.string, S.array(S.string));

export const killSupermanSchema = S.any;

export const withDefaultsSchema = S.struct({
  theAnswerToTheUltimateQuestionOfLife: S.optional(S.number).withDefault(
    () => 42
  ),
  isVulnerable: S.optional(S.boolean).withDefault(() => false),
  name: S.optional(
    S.union(S.literal("clark"), S.literal("superman"), S.literal("kal-l"))
  ).withDefault(() => "clark"),
  theMeaningOf42: S.optional(S.string).withDefault(
    () => "The Answer to the Ultimate Question of Life"
  ),
  emptyString: S.optional(S.string).withDefault(() => ""),
  booleanAsString: S.optional(S.string).withDefault(() => "true"),
});

const nonExportedSchema = S.struct({
  name: S.string,
});

export const exportedSchema = S.struct({
  a: nonExportedSchema,
  b: S.string,
});

const personSchema = S.struct({
  name: S.string,
});

const infoSchema = S.struct({
  age: S.number,
});

export const pipeSchema = S.struct({
  name: S.literal("pipe"),
  pipe: S.any,
});

const promiseSchema = S.instanceOf(Promise);

export const supermanEnemySchema =
  S.getPropertySignatures(supermanSchema).enemies;

export const supermanNameSchema = S.getPropertySignatures(supermanSchema).name;

export const supermanInvinciblePowerSchema = S.getPropertySignatures(
  S.getPropertySignatures(supermanSchema).powers
)[2];

export const krytonResponseSchema = promiseSchema;

export const evilPlanSchema: ObjectSchema<EvilPlan> = S.lazy(() =>
  S.struct({
    date: S.Date,
    owner: villainSchema,
    description: S.string,
    details: evilPlanDetailsSchema,
  })
);

export const evilPlanDetailsSchema: ObjectSchema<EvilPlanDetails> = S.lazy(() =>
  S.struct({
    parent: evilPlanSchema,
    steps: S.array(S.string),
  })
);

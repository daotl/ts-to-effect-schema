/**
 * ts-to-effect-schema configuration.
 *
 * @type {import("./src/config").TsToZodConfig}
 */
module.exports = [
	{
		name: "example",
		input: "example/heros.ts",
		output: "example/heros.schema.ts",
		inferredTypes: "example/heros.types.ts",
	},
	{ name: "config", input: "src/config.ts", output: "src/config.schema.ts" },
];

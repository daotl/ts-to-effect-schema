export interface SimplifiedJSDocTag {
    /**
     * Name of the tag
     *
     * @ref tag.tagName.escapedText.toString()
     */
    name: string;
    /**
     * Value of the tag
     *
     * @ref tag.comment
     */
    value?: string;
}
export type GetSchemaName = (identifier: string) => string;
export type NameFilter = (name: string) => boolean;
export type JSDocTagFilter = (tags: SimplifiedJSDocTag[]) => boolean;
export type Config = {
    /**
     * Path of the input file (types source)
     */
    input: string;
    /**
     * Path of the output file (generated effect schemas)
     */
    output: string;
    /**
     * Skip the validation step (not recommended)
     */
    skipValidation?: boolean;
    /**
     * Filter on type/interface name.
     */
    nameFilter?: NameFilter;
    /**
     * Filter on JSDocTag.
     */
    jsDocTagFilter?: JSDocTagFilter;
    /**
     * Schema name generator.
     */
    getSchemaName?: GetSchemaName;
    /**
     * Keep parameters comments.
     * @default false
     */
    keepComments?: boolean;
    /**
     * Skip the creation of effect validators from JSDoc annotations
     *
     * @default false
     */
    skipParseJSDoc?: boolean;
    /**
     * Path of S.To<> types file.
     */
    inferredTypes?: string;
};
export type Configs = Array<Config & {
    /**
     * Name of the config.
     *
     * Usage: `ts-to-effect-schema --config {name}`
     */
    name: string;
}>;
export type TsToEffectConfig = Config | Configs;

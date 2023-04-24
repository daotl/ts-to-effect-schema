import * as S from "@effect/schema/Schema";
export declare const simplifiedJSDocTagSchema: S.Schema<{
    readonly name: string;
    readonly value?: string | undefined;
}, {
    readonly name: string;
    readonly value?: string | undefined;
}>;
export declare const getSchemaNameSchema: S.Schema<any, any>;
export declare const nameFilterSchema: S.Schema<any, any>;
export declare const jSDocTagFilterSchema: S.Schema<any, any>;
export declare const configSchema: S.Schema<{
    readonly input: string;
    readonly output: string;
    readonly skipValidation?: boolean | undefined;
    readonly nameFilter?: any;
    readonly jsDocTagFilter?: any;
    readonly getSchemaName?: any;
    readonly keepComments?: boolean | undefined;
    readonly skipParseJSDoc?: boolean | undefined;
    readonly inferredTypes?: string | undefined;
}, {
    readonly input: string;
    readonly output: string;
    readonly keepComments: boolean;
    readonly skipParseJSDoc: boolean;
    readonly skipValidation?: boolean | undefined;
    readonly nameFilter?: any;
    readonly jsDocTagFilter?: any;
    readonly getSchemaName?: any;
    readonly inferredTypes?: string | undefined;
}>;
export declare const configsSchema: S.Schema<readonly {
    readonly input: string;
    readonly output: string;
    readonly skipValidation?: boolean | undefined;
    readonly nameFilter?: any;
    readonly jsDocTagFilter?: any;
    readonly getSchemaName?: any;
    readonly keepComments?: boolean | undefined;
    readonly skipParseJSDoc?: boolean | undefined;
    readonly inferredTypes?: string | undefined;
    readonly name: string;
}[], readonly {
    readonly input: string;
    readonly output: string;
    readonly keepComments: boolean;
    readonly skipParseJSDoc: boolean;
    readonly skipValidation?: boolean | undefined;
    readonly nameFilter?: any;
    readonly jsDocTagFilter?: any;
    readonly getSchemaName?: any;
    readonly inferredTypes?: string | undefined;
    readonly name: string;
}[]>;
export declare const tsToEffectConfigSchema: S.Schema<{
    readonly input: string;
    readonly output: string;
    readonly skipValidation?: boolean | undefined;
    readonly nameFilter?: any;
    readonly jsDocTagFilter?: any;
    readonly getSchemaName?: any;
    readonly keepComments?: boolean | undefined;
    readonly skipParseJSDoc?: boolean | undefined;
    readonly inferredTypes?: string | undefined;
} | readonly {
    readonly input: string;
    readonly output: string;
    readonly skipValidation?: boolean | undefined;
    readonly nameFilter?: any;
    readonly jsDocTagFilter?: any;
    readonly getSchemaName?: any;
    readonly keepComments?: boolean | undefined;
    readonly skipParseJSDoc?: boolean | undefined;
    readonly inferredTypes?: string | undefined;
    readonly name: string;
}[], {
    readonly input: string;
    readonly output: string;
    readonly keepComments: boolean;
    readonly skipParseJSDoc: boolean;
    readonly skipValidation?: boolean | undefined;
    readonly nameFilter?: any;
    readonly jsDocTagFilter?: any;
    readonly getSchemaName?: any;
    readonly inferredTypes?: string | undefined;
} | readonly {
    readonly input: string;
    readonly output: string;
    readonly keepComments: boolean;
    readonly skipParseJSDoc: boolean;
    readonly skipValidation?: boolean | undefined;
    readonly nameFilter?: any;
    readonly jsDocTagFilter?: any;
    readonly getSchemaName?: any;
    readonly inferredTypes?: string | undefined;
    readonly name: string;
}[]>;

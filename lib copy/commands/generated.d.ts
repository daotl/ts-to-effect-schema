import type { OutputFlags } from '@oclif/core/lib/interfaces/parser';
import { Command } from '@oclif/core';
import { TsToEffectConfig, Config } from '../config';
type ConfigExt = '.js' | '.cjs';
declare class TsToEffect extends Command {
    static description: string;
    static usage: string[] | undefined;
    static flags: {
        version: import("@oclif/core/lib/interfaces/parser").BooleanFlag<void>;
        help: import("@oclif/core/lib/interfaces/parser").BooleanFlag<void>;
        esm: import("@oclif/core/lib/interfaces/parser").BooleanFlag<boolean>;
        keepComments: import("@oclif/core/lib/interfaces/parser").BooleanFlag<boolean>;
        init: import("@oclif/core/lib/interfaces/parser").BooleanFlag<boolean>;
        skipParseJSDoc: import("@oclif/core/lib/interfaces/parser").BooleanFlag<boolean>;
        skipValidation: import("@oclif/core/lib/interfaces/parser").BooleanFlag<boolean>;
        inferredTypes: import("@oclif/core/lib/interfaces/parser").OptionFlag<string | undefined, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
        watch: import("@oclif/core/lib/interfaces/parser").BooleanFlag<boolean>;
        config: import("@oclif/core/lib/interfaces/parser").OptionFlag<string | undefined, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
        all: import("@oclif/core/lib/interfaces/parser").BooleanFlag<boolean>;
    };
    static args: {
        input: import("@oclif/core/lib/interfaces/parser").Arg<string | undefined, Record<string, unknown>>;
        output: import("@oclif/core/lib/interfaces/parser").Arg<string | undefined, Record<string, unknown>>;
    };
    run(): Promise<void>;
    /**
     * Generate on effect schema file.
     * @param args
     * @param fileConfig
     * @param flags
     */
    generate(args: {
        input?: string;
        output?: string;
    }, fileConfig: Config | undefined, flags: OutputFlags<typeof TsToEffect.flags>): Promise<{
        success: true;
    } | {
        success: false;
        error: string;
    }>;
    /**
     * Load user config from `ts-to-effect-schema.config.js`
     */
    loadFileConfig(config: TsToEffectConfig | undefined, flags: OutputFlags<typeof TsToEffect.flags>, ext: ConfigExt): Promise<TsToEffectConfig | undefined>;
}
export = TsToEffect;

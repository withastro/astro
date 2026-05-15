import type { DeepPartial } from '../../type-utils.js';
import type { AstroConfig, AstroInlineConfig } from '../../types/public/index.js';
export declare function mergeConfig<C extends AstroConfig | AstroInlineConfig>(
	defaults: C,
	overrides: DeepPartial<C>,
): C;

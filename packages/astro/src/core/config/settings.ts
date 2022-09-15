import type {
	AstroConfig,
	AstroSettings,
} from '../../@types/astro';
import type { TsConfigJson } from 'tsconfig-resolver';

import jsxRenderer from '../../jsx/renderer.js';

export function createSettings(
	config: AstroConfig,
	tsConfig: TsConfigJson | undefined,
	tsConfigPath: string | undefined,
): AstroSettings {
	return {
		config,
		tsConfig,
		tsConfigPath,

		adapter: undefined,
		injectedRoutes: [],
		pageExtensions: ['.astro', '.md', '.html'],
		renderers: [jsxRenderer],
		scripts: [],
	};
}

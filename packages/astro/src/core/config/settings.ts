import type { TsConfigJson } from 'tsconfig-resolver';
import type { AstroConfig, AstroSettings } from '../../@types/astro';

import jsxRenderer from '../../jsx/renderer.js';

export interface CreateSettings {
	config: AstroConfig;
	tsConfig?: TsConfigJson;
	tsConfigPath?: string;
}

export function createSettings({ config, tsConfig, tsConfigPath }: CreateSettings): AstroSettings {
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

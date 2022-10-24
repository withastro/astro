import { SUPPORTED_MARKDOWN_FILE_EXTENSIONS } from './../constants';
import type { AstroConfig, AstroSettings } from '../../@types/astro';

import jsxRenderer from '../../jsx/renderer.js';
import { loadTSConfig } from './tsconfig.js';

export function createSettings(config: AstroConfig, cwd?: string): AstroSettings {
	const tsconfig = loadTSConfig(cwd);

	return {
		config,
		tsConfig: tsconfig?.config,
		tsConfigPath: tsconfig?.path,

		adapter: undefined,
		injectedRoutes: [],
		pageExtensions: ['.astro', '.html', ...SUPPORTED_MARKDOWN_FILE_EXTENSIONS],
		renderers: [jsxRenderer],
		scripts: [],
		watchFiles: tsconfig?.exists ? [tsconfig.path, ...tsconfig.extendedPaths] : [],
	};
}

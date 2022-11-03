import type { AstroConfig, AstroSettings, AstroUserConfig } from '../../@types/astro';
import { SUPPORTED_MARKDOWN_FILE_EXTENSIONS } from './../constants.js';

import { fileURLToPath } from 'url';
import jsxRenderer from '../../jsx/renderer.js';
import { createDefaultDevConfig } from './config.js';
import { loadTSConfig } from './tsconfig.js';

export function createBaseSettings(config: AstroConfig): AstroSettings {
	return {
		config,
		tsConfig: undefined,
		tsConfigPath: undefined,

		adapter: undefined,
		injectedRoutes: [],
		pageExtensions: ['.astro', '.html', ...SUPPORTED_MARKDOWN_FILE_EXTENSIONS],
		renderers: [jsxRenderer],
		scripts: [],
		watchFiles: [],
	};
}

export function createSettings(config: AstroConfig, cwd?: string): AstroSettings {
	const tsconfig = loadTSConfig(cwd);
	const settings = createBaseSettings(config);
	settings.tsConfig = tsconfig?.config;
	settings.tsConfigPath = tsconfig?.path;
	settings.watchFiles = tsconfig?.exists ? [tsconfig.path, ...tsconfig.extendedPaths] : [];
	return settings;
}

export async function createDefaultDevSettings(
	userConfig: AstroUserConfig = {},
	root?: string | URL
): Promise<AstroSettings> {
	if (root && typeof root !== 'string') {
		root = fileURLToPath(root);
	}
	const config = await createDefaultDevConfig(userConfig, root);
	return createBaseSettings(config);
}

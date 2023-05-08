import type { AstroConfig, AstroSettings, AstroUserConfig } from '../../@types/astro';
import { SUPPORTED_MARKDOWN_FILE_EXTENSIONS } from './../constants.js';

import { type ErrorPayload as ViteErrorPayload } from 'vite';
import { fileURLToPath, pathToFileURL } from 'url';
import jsxRenderer from '../../jsx/renderer.js';
import { markdownContentEntryType } from '../../vite-plugin-markdown/content-entry-type.js';
import { createDefaultDevConfig } from './config.js';
import { AstroTimer } from './timer.js';
import { loadTSConfig } from './tsconfig.js';
import yaml, { type YAMLException } from 'js-yaml';
import { formatYAMLException } from '../errors/utils.js';

export function createBaseSettings(config: AstroConfig): AstroSettings {
	return {
		config,
		tsConfig: undefined,
		tsConfigPath: undefined,

		adapter: undefined,
		injectedRoutes:
			config.experimental.assets && config.output === 'server'
				? [{ pattern: '/_image', entryPoint: 'astro/assets/image-endpoint' }]
				: [],
		pageExtensions: ['.astro', '.html', ...SUPPORTED_MARKDOWN_FILE_EXTENSIONS],
		contentEntryTypes: [markdownContentEntryType],
		dataEntryTypes: [
			{
				extensions: ['.json'],
				getEntryInfo({ contents }) {
					if (contents === undefined || contents === '') return { data: {} };

					const data = JSON.parse(contents);

					if (data == null || typeof data !== 'object')
						throw new Error('[Content] JSON entry must be an object.');

					return { data };
				},
			},
			{
				extensions: ['.yaml'],
				getEntryInfo({ contents, fileUrl }) {
					try {
						const data = yaml.load(contents, { filename: fileURLToPath(fileUrl) });
						const rawData = contents;

						return { data, rawData };
					} catch (e: any) {
						if (e.name === 'YAMLException') {
							throw formatYAMLException(e as YAMLException);
						} else {
							throw e;
						}
					}
				},
			},
		],
		renderers: [jsxRenderer],
		scripts: [],
		watchFiles: [],
		forceDisableTelemetry: false,
		timer: new AstroTimer(),
	};
}

export function createSettings(config: AstroConfig, cwd?: string): AstroSettings {
	const tsconfig = loadTSConfig(cwd);
	const settings = createBaseSettings(config);

	const watchFiles = tsconfig?.exists ? [tsconfig.path, ...tsconfig.extendedPaths] : [];

	if (cwd) {
		watchFiles.push(fileURLToPath(new URL('./package.json', pathToFileURL(cwd))));
	}

	settings.tsConfig = tsconfig?.config;
	settings.tsConfigPath = tsconfig?.path;
	settings.watchFiles = watchFiles;
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

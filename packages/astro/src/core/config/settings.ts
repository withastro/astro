import yaml from 'js-yaml';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'url';
import type { AstroConfig, AstroSettings, AstroUserConfig } from '../../@types/astro';
import { getContentPaths } from '../../content/index.js';
import jsxRenderer from '../../jsx/renderer.js';
import { isServerLikeOutput } from '../../prerender/utils.js';
import { markdownContentEntryType } from '../../vite-plugin-markdown/content-entry-type.js';
import { getDefaultClientDirectives } from '../client-directive/index.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { formatYAMLException, isYAMLException } from '../errors/utils.js';
import { SUPPORTED_MARKDOWN_FILE_EXTENSIONS } from './../constants.js';
import { createDefaultDevConfig } from './config.js';
import { AstroTimer } from './timer.js';
import { loadTSConfig } from './tsconfig.js';

export function createBaseSettings(config: AstroConfig): AstroSettings {
	const { contentDir } = getContentPaths(config);
	return {
		config,
		tsConfig: undefined,
		tsConfigPath: undefined,

		adapter: undefined,
		injectedRoutes:
			config.experimental.assets && isServerLikeOutput(config)
				? [{ pattern: '/_image', entryPoint: 'astro/assets/image-endpoint', prerender: false }]
				: [],
		pageExtensions: ['.astro', '.html', ...SUPPORTED_MARKDOWN_FILE_EXTENSIONS],
		contentEntryTypes: [markdownContentEntryType],
		dataEntryTypes: [
			{
				extensions: ['.json'],
				getEntryInfo({ contents, fileUrl }) {
					if (contents === undefined || contents === '') return { data: {} };

					const pathRelToContentDir = path.relative(
						fileURLToPath(contentDir),
						fileURLToPath(fileUrl)
					);
					let data;
					try {
						data = JSON.parse(contents);
					} catch (e) {
						throw new AstroError({
							...AstroErrorData.DataCollectionEntryParseError,
							message: AstroErrorData.DataCollectionEntryParseError.message(
								pathRelToContentDir,
								e instanceof Error ? e.message : 'contains invalid JSON.'
							),
							location: { file: fileUrl.pathname },
							stack: e instanceof Error ? e.stack : undefined,
						});
					}

					if (data == null || typeof data !== 'object') {
						throw new AstroError({
							...AstroErrorData.DataCollectionEntryParseError,
							message: AstroErrorData.DataCollectionEntryParseError.message(
								pathRelToContentDir,
								'data is not an object.'
							),
							location: { file: fileUrl.pathname },
						});
					}

					return { data };
				},
			},
			{
				extensions: ['.yaml', '.yml'],
				getEntryInfo({ contents, fileUrl }) {
					try {
						const data = yaml.load(contents, { filename: fileURLToPath(fileUrl) });
						const rawData = contents;

						return { data, rawData };
					} catch (e) {
						const pathRelToContentDir = path.relative(
							fileURLToPath(contentDir),
							fileURLToPath(fileUrl)
						);
						const formattedError = isYAMLException(e)
							? formatYAMLException(e)
							: new Error('contains invalid YAML.');

						throw new AstroError({
							...AstroErrorData.DataCollectionEntryParseError,
							message: AstroErrorData.DataCollectionEntryParseError.message(
								pathRelToContentDir,
								formattedError.message
							),
							stack: formattedError.stack,
							location:
								'loc' in formattedError
									? { file: fileUrl.pathname, ...formattedError.loc }
									: { file: fileUrl.pathname },
						});
					}
				},
			},
		],
		renderers: [jsxRenderer],
		scripts: [],
		clientDirectives: getDefaultClientDirectives(),
		watchFiles: [],
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

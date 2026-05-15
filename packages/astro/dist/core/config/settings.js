import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import yaml from 'js-yaml';
import toml from 'smol-toml';
import { getContentPaths } from '../../content/index.js';
import createPreferences from '../../preferences/index.js';
import { markdownContentEntryType } from '../../vite-plugin-markdown/content-entry-type.js';
import { getDefaultClientDirectives } from '../client-directive/index.js';
import { SUPPORTED_MARKDOWN_FILE_EXTENSIONS } from './../constants.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import {
	formatTOMLError,
	formatYAMLException,
	isTOMLError,
	isYAMLException,
} from '../errors/utils.js';
import { AstroTimer } from './timer.js';
import { loadTSConfig } from './tsconfig.js';
function createBaseSettings(config, logLevel) {
	const { contentDir } = getContentPaths(config, void 0, config.legacy?.collectionsBackwardsCompat);
	const dotAstroDir = new URL('.astro/', config.root);
	const preferences = createPreferences(config, dotAstroDir);
	return {
		config,
		preferences,
		tsConfig: void 0,
		tsConfigPath: void 0,
		adapter: void 0,
		prerenderer: void 0,
		injectedRoutes: [],
		resolvedInjectedRoutes: [],
		pageExtensions: ['.astro', '.html', ...SUPPORTED_MARKDOWN_FILE_EXTENSIONS],
		contentEntryTypes: [markdownContentEntryType],
		dataEntryTypes: [
			{
				extensions: ['.json'],
				getEntryInfo({ contents, fileUrl }) {
					if (contents === void 0 || contents === '') return { data: {} };
					const pathRelToContentDir = path.relative(
						fileURLToPath(contentDir),
						fileURLToPath(fileUrl),
					);
					let data;
					try {
						data = JSON.parse(contents);
					} catch (e) {
						throw new AstroError({
							...AstroErrorData.DataCollectionEntryParseError,
							message: AstroErrorData.DataCollectionEntryParseError.message(
								pathRelToContentDir,
								e instanceof Error ? e.message : 'contains invalid JSON.',
							),
							location: { file: fileUrl.pathname },
							stack: e instanceof Error ? e.stack : void 0,
						});
					}
					if (data == null || typeof data !== 'object') {
						throw new AstroError({
							...AstroErrorData.DataCollectionEntryParseError,
							message: AstroErrorData.DataCollectionEntryParseError.message(
								pathRelToContentDir,
								'data is not an object.',
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
							fileURLToPath(fileUrl),
						);
						const formattedError = isYAMLException(e)
							? formatYAMLException(e)
							: new Error('contains invalid YAML.');
						throw new AstroError({
							...AstroErrorData.DataCollectionEntryParseError,
							message: AstroErrorData.DataCollectionEntryParseError.message(
								pathRelToContentDir,
								formattedError.message,
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
			{
				extensions: ['.toml'],
				getEntryInfo({ contents, fileUrl }) {
					try {
						const data = toml.parse(contents);
						const rawData = contents;
						return { data, rawData };
					} catch (e) {
						const pathRelToContentDir = path.relative(
							fileURLToPath(contentDir),
							fileURLToPath(fileUrl),
						);
						const formattedError = isTOMLError(e)
							? formatTOMLError(e)
							: new Error('contains invalid TOML.');
						throw new AstroError({
							...AstroErrorData.DataCollectionEntryParseError,
							message: AstroErrorData.DataCollectionEntryParseError.message(
								pathRelToContentDir,
								formattedError.message,
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
		renderers: [],
		scripts: [],
		clientDirectives: getDefaultClientDirectives(),
		middlewares: { pre: [], post: [] },
		watchFiles: [],
		devToolbarApps: [],
		timer: new AstroTimer(),
		dotAstroDir,
		latestAstroVersion: void 0,
		// Will be set later if applicable when the dev server starts
		injectedTypes: [],
		buildOutput: void 0,
		injectedCsp: {
			fontResources: /* @__PURE__ */ new Set(),
			styleHashes: [],
		},
		logLevel: logLevel ?? 'info',
		fontsHttpServer: null,
	};
}
async function createSettings(config, logLevel, cwd) {
	const tsconfig = await loadTSConfig(cwd);
	const settings = createBaseSettings(config, logLevel);
	let watchFiles = [];
	if (cwd) {
		watchFiles.push(fileURLToPath(new URL('./package.json', pathToFileURL(cwd))));
	}
	if (!tsconfig.error) {
		watchFiles.push(...tsconfig.sources);
		settings.tsConfig = tsconfig.tsconfig;
		settings.tsConfigPath = tsconfig.tsconfigFile;
	}
	settings.watchFiles = watchFiles;
	return settings;
}
export { createBaseSettings, createSettings };

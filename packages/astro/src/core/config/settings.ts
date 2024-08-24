import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import yaml from 'js-yaml';
import { getContentPaths } from '../../content/index.js';
import createPreferences from '../../preferences/index.js';
import type { AstroSettings } from '../../types/astro.js';
import type { AstroConfig } from '../../types/public/config.js';
import { markdownContentEntryType } from '../../vite-plugin-markdown/content-entry-type.js';
import { getDefaultClientDirectives } from '../client-directive/index.js';
import { AstroError, AstroErrorData, createSafeError } from '../errors/index.js';
import { formatYAMLException, isYAMLException } from '../errors/utils.js';
import { SUPPORTED_MARKDOWN_FILE_EXTENSIONS } from './../constants.js';
import { AstroTimer } from './timer.js';
import { loadTSConfig, type TSConfig } from './tsconfig.js';
import { GENERATED_TSCONFIG_PATH } from './constants.js';
import type { Logger } from '../logger/core.js';
import boxen from 'boxen';
import { formatErrorMessage } from '../messages.js';
import { collectErrorMetadata } from '../errors/dev/utils.js';
import { getDiffContent } from '../../cli/add/index.js';

export function createBaseSettings(config: AstroConfig): AstroSettings {
	const { contentDir } = getContentPaths(config);
	const dotAstroDir = new URL('.astro/', config.root);
	const preferences = createPreferences(config, dotAstroDir);
	return {
		config,
		preferences,
		tsConfig: undefined,
		tsConfigPath: undefined,
		adapter: undefined,
		injectedRoutes: [],
		resolvedInjectedRoutes: [],
		serverIslandMap: new Map(),
		serverIslandNameMap: new Map(),
		pageExtensions: ['.astro', '.html', ...SUPPORTED_MARKDOWN_FILE_EXTENSIONS],
		contentEntryTypes: [markdownContentEntryType],
		dataEntryTypes: [
			{
				extensions: ['.json'],
				getEntryInfo({ contents, fileUrl }) {
					if (contents === undefined || contents === '') return { data: {} };

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
							stack: e instanceof Error ? e.stack : undefined,
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
		],
		renderers: [],
		scripts: [],
		clientDirectives: getDefaultClientDirectives(),
		middlewares: { pre: [], post: [] },
		watchFiles: [],
		devToolbarApps: [],
		timer: new AstroTimer(),
		dotAstroDir,
		latestAstroVersion: undefined, // Will be set later if applicable when the dev server starts
		injectedTypes: [],
	};
}

export async function createSettings(
	config: AstroConfig,
	logger: Logger,
	cwd?: string,
): Promise<AstroSettings> {
	const tsconfig = await loadTSConfig(cwd);
	const settings = createBaseSettings(config);

	let watchFiles = [];
	if (cwd) {
		watchFiles.push(fileURLToPath(new URL('./package.json', pathToFileURL(cwd))));
	}

	if (typeof tsconfig !== 'string') {
		validateTsconfig(settings, logger, tsconfig.rawConfig);
		watchFiles.push(
			...[tsconfig.tsconfigFile, ...(tsconfig.extended ?? []).map((e) => e.tsconfigFile)],
		);
		settings.tsConfig = tsconfig.tsconfig;
		settings.tsConfigPath = tsconfig.tsconfigFile;
	}

	settings.watchFiles = watchFiles;

	return settings;
}

function validateTsconfig(settings: AstroSettings, logger: Logger, rawConfig: TSConfig) {
	try {
		const { typescript } = settings.config.experimental;
		if (!typescript) {
			return;
		}

		let newConfig = { ...rawConfig };

		if (!rawConfig.extends) {
			newConfig.extends = ['astro/tsconfigs/base', GENERATED_TSCONFIG_PATH];
			throw createTsconfigError(logger, rawConfig, newConfig);
		} else if (
			typeof rawConfig.extends === 'string' &&
			rawConfig.extends !== GENERATED_TSCONFIG_PATH
		) {
			newConfig.extends = [rawConfig.extends, GENERATED_TSCONFIG_PATH];
			throw createTsconfigError(logger, rawConfig, newConfig);
		} else if (!rawConfig.extends.includes(GENERATED_TSCONFIG_PATH)) {
			newConfig.extends = [...rawConfig.extends, GENERATED_TSCONFIG_PATH];
			throw createTsconfigError(logger, rawConfig, newConfig);
		}

		if (rawConfig.include) {
			logger.warn(
				'types',
				`Your root "tsconfig.json" has an "include" field. This will break types, please move it to your Astro config experimental.typescript.include option`,
			);
		}
		if (rawConfig.exclude) {
			logger.warn(
				'types',
				`Your root "tsconfig.json" has an "exclude" field. This will break types, please move it to your Astro config experimental.typescript.exclude option`,
			);
		}
	} catch (err) {
		const error = createSafeError(err);
		logger.error(
			'config',
			formatErrorMessage(collectErrorMetadata(error), logger.level() === 'debug') + '\n',
		);
		// Will return exit code 1 in CLI
		throw error;
	}
}

function createTsconfigError(logger: Logger, rawConfig: TSConfig, newConfig: TSConfig): AstroError {
	const diff = getDiffContent(
		JSON.stringify(rawConfig, null, 2),
		JSON.stringify(newConfig, null, 2),
	)!;
	const message = `\n${boxen(diff, {
		margin: 0.5,
		padding: 0.5,
		borderStyle: 'round',
		title: 'tsconfig.json',
	})}\n`;
	logger.info('SKIP_FORMAT', message);
	return new AstroError(AstroErrorData.TSConfigInvalidExtends);
}

import yaml from 'js-yaml';
import { dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { AstroConfig, AstroSettings } from '../../@types/astro.js';
import { getContentPaths } from '../../content/index.js';
import createPreferences from '../../preferences/index.js';
import { markdownContentEntryType } from '../../vite-plugin-markdown/content-entry-type.js';
import { getDefaultClientDirectives } from '../client-directive/index.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { formatYAMLException, isYAMLException } from '../errors/utils.js';
import { SUPPORTED_MARKDOWN_FILE_EXTENSIONS } from './../constants.js';
import { AstroTimer } from './timer.js';
import { loadTSConfig } from './tsconfig.js';
import type { Logger } from '../logger/core.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { TSConfckParseResult } from 'tsconfck';

export function createBaseSettings(config: AstroConfig): AstroSettings {
	const { contentDir } = getContentPaths(config);
	const preferences = createPreferences(config);
	return {
		config,
		preferences,
		tsConfig: undefined,
		tsConfigPath: undefined,
		adapter: undefined,
		injectedRoutes: [],
		resolvedInjectedRoutes: [],
		pageExtensions: ['.astro', '.html', ...SUPPORTED_MARKDOWN_FILE_EXTENSIONS],
		contentEntryTypes: [markdownContentEntryType],
		dataEntryTypes: [
			{
				extensions: ['.json'],
				getEntryInfo({ contents, fileUrl }) {
					if (contents === undefined || contents === '') return { data: {} };

					const pathRelToContentDir = relative(fileURLToPath(contentDir), fileURLToPath(fileUrl));
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
						const pathRelToContentDir = relative(fileURLToPath(contentDir), fileURLToPath(fileUrl));
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
		renderers: [],
		scripts: [],
		clientDirectives: getDefaultClientDirectives(),
		middlewares: { pre: [], post: [] },
		watchFiles: [],
		devToolbarApps: [],
		timer: new AstroTimer(),
	};
}

async function handleTypescriptConfig(
	astroConfig: AstroConfig,
	tsconfig: TSConfckParseResult,
	logger: Logger
) {
	const invalidFields: Array<string> = [];

	if (tsconfig.tsconfig?.include?.length > 0) {
		invalidFields.push('include');
	}
	if (tsconfig.tsconfig?.exclude?.length > 0) {
		invalidFields.push('exclude');
	}
	if (tsconfig.tsconfig?.files?.length > 0) {
		invalidFields.push('files');
	}

	if (invalidFields.length > 0) {
		logger.warn(
			null,
			`The following fields of your tsconfig.json will conflict with Astro: ${invalidFields.join(
				', '
			)}`
		);
	}

	function getRelativePathToCacheDir(url: URL) {
		const path = fileURLToPath(url);
		return relative(fileURLToPath(new URL('.astro', astroConfig.root)), path).replaceAll('\\', '/');
	}

	function getField(_tsconfig: any, name: 'include' | 'exclude' | 'files') {
		return [
			...(astroConfig.typescript?.[name] ?? []),
			...(invalidFields.includes(name) ? (_tsconfig[name] as Array<string>) : []),
		];
	}

	function deduplicate<T extends Array<unknown>>(array: T) {
		return [...new Set([...array])];
	}

	const newTsconfig = {
		include: deduplicate(['astro/client', ...getField(tsconfig.tsconfig, 'include')]),
		exclude: deduplicate([
			...getField(tsconfig.tsconfig, 'exclude'),
			...(astroConfig.typescript?.excludeDefaults
				? [
						getRelativePathToCacheDir(astroConfig.outDir),
						getRelativePathToCacheDir(astroConfig.publicDir),
					]
				: []),
		]),
		files: deduplicate(getField(tsconfig.tsconfig, 'files')),
	};

	const rawTsConfigPath = './.astro/tsconfig.json';
	const tsconfigPath = fileURLToPath(new URL(rawTsConfigPath, astroConfig.root));
	mkdirSync(dirname(tsconfigPath), { recursive: true });
	writeFileSync(tsconfigPath, JSON.stringify(newTsconfig, null, 2), 'utf-8');

	const outputTsconfig = tsconfig.tsconfig;
	if (typeof tsconfig.tsconfig.extends === 'string') {
		outputTsconfig.extends = [tsconfig.tsconfig.extends, rawTsConfigPath];
		writeFileSync(tsconfig.tsconfigFile, JSON.stringify(outputTsconfig, null, 2), 'utf-8');
	} else if (
		Array.isArray(tsconfig.tsconfig.extends) &&
		!tsconfig.tsconfig.extends.includes(rawTsConfigPath)
	) {
		outputTsconfig.extends = [...tsconfig.tsconfig.extends, rawTsConfigPath];
		writeFileSync(tsconfig.tsconfigFile, JSON.stringify(outputTsconfig, null, 2), 'utf-8');
	}
}

export async function createSettings(config: AstroConfig, cwd?: string): Promise<AstroSettings> {
	const tsconfig = await loadTSConfig(cwd);
	const settings = createBaseSettings(config);

	let watchFiles = [];
	if (cwd) {
		watchFiles.push(fileURLToPath(new URL('./package.json', pathToFileURL(cwd))));
	}

	if (typeof tsconfig !== 'string') {
		await handleTypescriptConfig(
			config,
			tsconfig.rawConfig,
			// TODO: find how to pass a real logger
			{
				warn: (_: any, msg: string) => console.log(msg),
			} as any
		);
		watchFiles.push(
			...[tsconfig.tsconfigFile, ...(tsconfig.extended ?? []).map((e) => e.tsconfigFile)]
		);
		settings.tsConfig = tsconfig.tsconfig;
		settings.tsConfigPath = tsconfig.tsconfigFile;
	}

	settings.watchFiles = watchFiles;

	return settings;
}

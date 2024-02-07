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
import { normalizePath } from 'vite';
import { isRelativePath } from '../path.js';

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
	config: AstroConfig,
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
			'config',
			`The following fields of your tsconfig.json must now be set inside your Astro config: ${invalidFields.join(
				', '
			)}. They will be merged until Astro 5, see TODO:link.`
		);
	}

	function getRelativePath(a: URL, b: URL) {
		return normalizePath(relative(fileURLToPath(a), fileURLToPath(b)));
	}

	function getField(_tsconfig: any, name: 'include' | 'exclude' | 'files') {
		return [
			...(config.typescript?.[name] ?? []),
			// TODO: remove in Astro 5
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
			...(config.typescript?.excludeDefaults
				? [
						getRelativePath(config.codegenDir, config.outDir),
						getRelativePath(config.codegenDir, config.publicDir),
					]
				: []),
		]),
		files: deduplicate(getField(tsconfig.tsconfig, 'files')),
	};

	let rawTsConfigPath = getRelativePath(config.root, new URL('tsconfig.json', config.codegenDir));
	if (!isRelativePath(rawTsConfigPath)) {
		rawTsConfigPath = `./${rawTsConfigPath}`
	}
	const tsconfigPath = fileURLToPath(new URL(rawTsConfigPath, config.root));
	mkdirSync(dirname(tsconfigPath), { recursive: true });
	writeFileSync(tsconfigPath, JSON.stringify(newTsconfig, null, 2), 'utf-8');

	// extends is a reserved keyword
	const { extends: extendsField } = tsconfig.tsconfig;
	if (Array.isArray(extendsField) && extendsField.includes(rawTsConfigPath)) {
		return;
	}

	const outputTsconfig = { ...tsconfig.tsconfig };
	outputTsconfig.extends = [
		...(typeof extendsField === 'string' ? [extendsField] : extendsField),
		rawTsConfigPath,
	];
	writeFileSync(tsconfig.tsconfigFile, JSON.stringify(outputTsconfig, null, 2), 'utf-8');
}

export async function createSettings(
	config: AstroConfig,
	logger: Logger,
	cwd?: string
): Promise<AstroSettings> {
	const tsconfig = await loadTSConfig(cwd);
	const settings = createBaseSettings(config);

	let watchFiles = [];
	if (cwd) {
		watchFiles.push(fileURLToPath(new URL('./package.json', pathToFileURL(cwd))));
	}

	if (typeof tsconfig !== 'string') {
		await handleTypescriptConfig(config, tsconfig.rawConfig, logger);
		watchFiles.push(
			...[tsconfig.tsconfigFile, ...(tsconfig.extended ?? []).map((e) => e.tsconfigFile)]
		);
		settings.tsConfig = tsconfig.tsconfig;
		settings.tsConfigPath = tsconfig.tsconfigFile;
	}

	settings.watchFiles = watchFiles;

	return settings;
}

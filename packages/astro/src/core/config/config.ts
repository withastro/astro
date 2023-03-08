import type { Arguments as Flags } from 'yargs-parser';
import type { AstroConfig, AstroUserConfig, CLIFlags } from '../../@types/astro';

import fs from 'fs';
import * as colors from 'kleur/colors';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { mergeConfig as mergeViteConfig } from 'vite';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { LogOptions } from '../logger/core.js';
import { arraify, isObject, isURL } from '../util.js';
import { createRelativeSchema } from './schema.js';
import { loadConfigWithVite } from './vite-load.js';

export const LEGACY_ASTRO_CONFIG_KEYS = new Set([
	'projectRoot',
	'src',
	'pages',
	'public',
	'dist',
	'styleOptions',
	'markdownOptions',
	'buildOptions',
	'devOptions',
]);

/** Turn raw config values into normalized values */
export async function validateConfig(
	userConfig: any,
	root: string,
	cmd: string
): Promise<AstroConfig> {
	const fileProtocolRoot = pathToFileURL(root + path.sep);
	// Manual deprecation checks
	/* eslint-disable no-console */
	if (userConfig.hasOwnProperty('renderers')) {
		console.error('Astro "renderers" are now "integrations"!');
		console.error('Update your configuration and install new dependencies:');
		try {
			const rendererKeywords = userConfig.renderers.map((r: string) =>
				r.replace('@astrojs/renderer-', '')
			);
			const rendererImports = rendererKeywords
				.map((r: string) => `  import ${r} from '@astrojs/${r === 'solid' ? 'solid-js' : r}';`)
				.join('\n');
			const rendererIntegrations = rendererKeywords.map((r: string) => `    ${r}(),`).join('\n');
			console.error('');
			console.error(colors.dim('  // astro.config.js'));
			if (rendererImports.length > 0) {
				console.error(colors.green(rendererImports));
			}
			console.error('');
			console.error(colors.dim('  // ...'));
			if (rendererIntegrations.length > 0) {
				console.error(colors.green('  integrations: ['));
				console.error(colors.green(rendererIntegrations));
				console.error(colors.green('  ],'));
			} else {
				console.error(colors.green('  integrations: [],'));
			}
			console.error('');
		} catch (err) {
			// We tried, better to just exit.
		}
		process.exit(1);
	}

	let legacyConfigKey: string | undefined;
	for (const key of Object.keys(userConfig)) {
		if (LEGACY_ASTRO_CONFIG_KEYS.has(key)) {
			legacyConfigKey = key;
			break;
		}
	}
	if (legacyConfigKey) {
		throw new AstroError({
			...AstroErrorData.ConfigLegacyKey,
			message: AstroErrorData.ConfigLegacyKey.message(legacyConfigKey),
		});
	}
	/* eslint-enable no-console */

	const AstroConfigRelativeSchema = createRelativeSchema(cmd, fileProtocolRoot);

	// First-Pass Validation
	const result = await AstroConfigRelativeSchema.parseAsync(userConfig);

	// If successful, return the result as a verified AstroConfig object.
	return result;
}

/** Convert the generic "yargs" flag object into our own, custom TypeScript object. */
export function resolveFlags(flags: Partial<Flags>): CLIFlags {
	return {
		root: typeof flags.root === 'string' ? flags.root : undefined,
		site: typeof flags.site === 'string' ? flags.site : undefined,
		base: typeof flags.base === 'string' ? flags.base : undefined,
		port: typeof flags.port === 'number' ? flags.port : undefined,
		config: typeof flags.config === 'string' ? flags.config : undefined,
		host:
			typeof flags.host === 'string' || typeof flags.host === 'boolean' ? flags.host : undefined,
		drafts: typeof flags.drafts === 'boolean' ? flags.drafts : undefined,
		experimentalAssets:
			typeof flags.experimentalAssets === 'boolean' ? flags.experimentalAssets : undefined,
	};
}

export function resolveRoot(cwd?: string | URL): string {
	if (cwd instanceof URL) {
		cwd = fileURLToPath(cwd);
	}
	return cwd ? path.resolve(cwd) : process.cwd();
}

/** Merge CLI flags & user config object (CLI flags take priority) */
function mergeCLIFlags(astroConfig: AstroUserConfig, flags: CLIFlags) {
	astroConfig.server = astroConfig.server || {};
	astroConfig.markdown = astroConfig.markdown || {};
	astroConfig.experimental = astroConfig.experimental || {};
	if (typeof flags.site === 'string') astroConfig.site = flags.site;
	if (typeof flags.base === 'string') astroConfig.base = flags.base;
	if (typeof flags.drafts === 'boolean') astroConfig.markdown.drafts = flags.drafts;
	if (typeof flags.port === 'number') {
		// @ts-expect-error astroConfig.server may be a function, but TS doesn't like attaching properties to a function.
		// TODO: Come back here and refactor to remove this expected error.
		astroConfig.server.port = flags.port;
	}
	if (typeof flags.host === 'string' || typeof flags.host === 'boolean') {
		// @ts-expect-error astroConfig.server may be a function, but TS doesn't like attaching properties to a function.
		// TODO: Come back here and refactor to remove this expected error.
		astroConfig.server.host = flags.host;
	}
	return astroConfig;
}

async function search(fsMod: typeof fs, root: string) {
	const paths = [
		'astro.config.mjs',
		'astro.config.js',
		'astro.config.ts',
		'astro.config.mts',
		'astro.config.cjs',
		'astro.config.cts',
	].map((p) => path.join(root, p));

	for (const file of paths) {
		if (fsMod.existsSync(file)) {
			return file;
		}
	}
}

interface LoadConfigOptions {
	cwd?: string;
	flags?: Flags;
	cmd: string;
	validate?: boolean;
	logging: LogOptions;
	/** Invalidate when reloading a previously loaded config */
	isRestart?: boolean;
	fsMod?: typeof fs;
}

interface ResolveConfigPathOptions {
	cwd?: string;
	flags?: Flags;
	fs: typeof fs;
}

/**
 * Resolve the file URL of the user's `astro.config.js|cjs|mjs|ts` file
 */
export async function resolveConfigPath(
	configOptions: ResolveConfigPathOptions
): Promise<string | undefined> {
	const root = resolveRoot(configOptions.cwd);
	const flags = resolveFlags(configOptions.flags || {});

	let userConfigPath: string | undefined;
	if (flags?.config) {
		userConfigPath = /^\.*\//.test(flags.config) ? flags.config : `./${flags.config}`;
		userConfigPath = fileURLToPath(new URL(userConfigPath, `file://${root}/`));
		if (!configOptions.fs.existsSync(userConfigPath)) {
			throw new AstroError({
				...AstroErrorData.ConfigNotFound,
				message: AstroErrorData.ConfigNotFound.message(flags.config),
			});
		}
	} else {
		userConfigPath = await search(configOptions.fs, root);
	}

	return userConfigPath;
}

interface OpenConfigResult {
	userConfig: AstroUserConfig;
	astroConfig: AstroConfig;
	flags: CLIFlags;
	root: string;
}

/** Load a configuration file, returning both the userConfig and astroConfig */
export async function openConfig(configOptions: LoadConfigOptions): Promise<OpenConfigResult> {
	const root = resolveRoot(configOptions.cwd);
	const flags = resolveFlags(configOptions.flags || {});
	let userConfig: AstroUserConfig = {};

	const config = await tryLoadConfig(configOptions, root);
	if (config) {
		userConfig = config.value;
	}
	const astroConfig = await resolveConfig(userConfig, root, flags, configOptions.cmd);

	return {
		astroConfig,
		userConfig,
		flags,
		root,
	};
}

interface TryLoadConfigResult {
	value: Record<string, any>;
	filePath?: string;
}

async function tryLoadConfig(
	configOptions: LoadConfigOptions,
	root: string
): Promise<TryLoadConfigResult | undefined> {
	const fsMod = configOptions.fsMod ?? fs;
	let finallyCleanup = async () => {};
	try {
		let configPath = await resolveConfigPath({
			cwd: configOptions.cwd,
			flags: configOptions.flags,
			fs: fsMod,
		});
		if (!configPath) return undefined;
		if (configOptions.isRestart) {
			// Hack: Write config to temporary file at project root
			// This invalidates and reloads file contents when using ESM imports or "resolve"
			const tempConfigPath = path.join(
				root,
				`.temp.${Date.now()}.config${path.extname(configPath)}`
			);

			const currentConfigContent = await fsMod.promises.readFile(configPath, 'utf-8');
			await fs.promises.writeFile(tempConfigPath, currentConfigContent);
			finallyCleanup = async () => {
				try {
					await fs.promises.unlink(tempConfigPath);
				} catch {
					/** file already removed */
				}
			};
			configPath = tempConfigPath;
		}

		// Create a vite server to load the config
		const config = await loadConfigWithVite({
			configPath,
			fs: fsMod,
			root,
		});
		return config as TryLoadConfigResult;
	} finally {
		await finallyCleanup();
	}
}

/** Attempt to resolve an Astro configuration object. Normalize, validate, and return. */
export async function resolveConfig(
	userConfig: AstroUserConfig,
	root: string,
	flags: CLIFlags = {},
	cmd: string
): Promise<AstroConfig> {
	const mergedConfig = mergeCLIFlags(userConfig, flags);
	const validatedConfig = await validateConfig(mergedConfig, root, cmd);

	return validatedConfig;
}

export function createDefaultDevConfig(
	userConfig: AstroUserConfig = {},
	root: string = process.cwd()
) {
	return resolveConfig(userConfig, root, undefined, 'dev');
}

function mergeConfigRecursively(
	defaults: Record<string, any>,
	overrides: Record<string, any>,
	rootPath: string
) {
	const merged: Record<string, any> = { ...defaults };
	for (const key in overrides) {
		const value = overrides[key];
		if (value == null) {
			continue;
		}

		const existing = merged[key];

		if (existing == null) {
			merged[key] = value;
			continue;
		}

		// fields that require special handling:
		if (key === 'vite' && rootPath === '') {
			merged[key] = mergeViteConfig(existing, value);
			continue;
		}

		if (Array.isArray(existing) || Array.isArray(value)) {
			merged[key] = [...arraify(existing ?? []), ...arraify(value ?? [])];
			continue;
		}
		if (isURL(existing) && isURL(value)) {
			merged[key] = value;
			continue;
		}
		if (isObject(existing) && isObject(value)) {
			merged[key] = mergeConfigRecursively(existing, value, rootPath ? `${rootPath}.${key}` : key);
			continue;
		}

		merged[key] = value;
	}
	return merged;
}

export function mergeConfig(
	defaults: Record<string, any>,
	overrides: Record<string, any>,
	isRoot = true
): Record<string, any> {
	return mergeConfigRecursively(defaults, overrides, isRoot ? '' : '.');
}

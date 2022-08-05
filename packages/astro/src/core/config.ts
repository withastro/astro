import type { RehypePlugin, RemarkPlugin } from '@astrojs/markdown-remark';
import type * as Postcss from 'postcss';
import type { ILanguageRegistration, IThemeRegistration, Theme } from 'shiki';
import type { Arguments as Flags } from 'yargs-parser';
import type { AstroConfig, AstroUserConfig, CLIFlags, ViteUserConfig } from '../@types/astro';

import load, { ProloadError, resolve } from '@proload/core';
import loadTypeScript from '@proload/plugin-tsm';
import * as colors from 'kleur/colors';
import path from 'path';
import postcssrc from 'postcss-load-config';
import { BUNDLED_THEMES } from 'shiki';
import { fileURLToPath, pathToFileURL } from 'url';
import * as vite from 'vite';
import { mergeConfig as mergeViteConfig } from 'vite';
import { z } from 'zod';
import jsxRenderer from '../jsx/renderer.js';
import { LogOptions } from './logger/core.js';
import { appendForwardSlash, prependForwardSlash, trimSlashes } from './path.js';
import { arraify, isObject } from './util.js';

load.use([loadTypeScript]);

interface PostCSSConfigResult {
	options: Postcss.ProcessOptions;
	plugins: Postcss.Plugin[];
}

const ASTRO_CONFIG_DEFAULTS: AstroUserConfig & any = {
	root: '.',
	srcDir: './src',
	publicDir: './public',
	outDir: './dist',
	base: '/',
	trailingSlash: 'ignore',
	build: { format: 'directory' },
	server: {
		host: false,
		port: 3000,
		streaming: true,
	},
	style: { postcss: { options: {}, plugins: [] } },
	integrations: [],
	markdown: {
		drafts: false,
		syntaxHighlight: 'shiki',
		shikiConfig: {
			langs: [],
			theme: 'github-dark',
			wrap: false,
		},
		remarkPlugins: [],
		rehypePlugins: [],
	},
	vite: {},
	legacy: {
		astroFlavoredMarkdown: false,
	},
};

async function resolvePostcssConfig(inlineOptions: any, root: URL): Promise<PostCSSConfigResult> {
	if (isObject(inlineOptions)) {
		const options = { ...inlineOptions };
		delete options.plugins;
		return {
			options,
			plugins: inlineOptions.plugins || [],
		};
	}
	const searchPath = typeof inlineOptions === 'string' ? inlineOptions : fileURLToPath(root);
	try {
		// @ts-ignore
		return await postcssrc({}, searchPath);
	} catch (err: any) {
		if (!/No PostCSS Config found/.test(err.message)) {
			throw err;
		}
		return {
			options: {},
			plugins: [],
		};
	}
}

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

export const AstroConfigSchema = z.object({
	root: z
		.string()
		.optional()
		.default(ASTRO_CONFIG_DEFAULTS.root)
		.transform((val) => new URL(val)),
	srcDir: z
		.string()
		.optional()
		.default(ASTRO_CONFIG_DEFAULTS.srcDir)
		.transform((val) => new URL(val)),
	publicDir: z
		.string()
		.optional()
		.default(ASTRO_CONFIG_DEFAULTS.publicDir)
		.transform((val) => new URL(val)),
	outDir: z
		.string()
		.optional()
		.default(ASTRO_CONFIG_DEFAULTS.outDir)
		.transform((val) => new URL(val)),
	site: z
		.string()
		.url()
		.optional()
		.transform((val) => (val ? appendForwardSlash(val) : val)),
	base: z
		.string()
		.optional()
		.default(ASTRO_CONFIG_DEFAULTS.base)
		.transform((val) => prependForwardSlash(appendForwardSlash(trimSlashes(val)))),
	trailingSlash: z
		.union([z.literal('always'), z.literal('never'), z.literal('ignore')])
		.optional()
		.default(ASTRO_CONFIG_DEFAULTS.trailingSlash),
	output: z
		.union([z.literal('static'), z.literal('server')])
		.optional()
		.default('static'),
	adapter: z.object({ name: z.string(), hooks: z.object({}).passthrough().default({}) }).optional(),
	integrations: z.preprocess(
		// preprocess
		(val) => (Array.isArray(val) ? val.flat(Infinity).filter(Boolean) : val),
		// validate
		z
			.array(z.object({ name: z.string(), hooks: z.object({}).passthrough().default({}) }))
			.default(ASTRO_CONFIG_DEFAULTS.integrations)
	),
	build: z
		.object({
			format: z
				.union([z.literal('file'), z.literal('directory')])
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.build.format),
		})
		.optional()
		.default({}),
	server: z.preprocess(
		// preprocess
		// NOTE: Uses the "error" command here because this is overwritten by the
		// individualized schema parser with the correct command.
		(val) => (typeof val === 'function' ? val({ command: 'error' }) : val),
		// validate
		z
			.object({
				host: z
					.union([z.string(), z.boolean()])
					.optional()
					.default(ASTRO_CONFIG_DEFAULTS.server.host),
				port: z.number().optional().default(ASTRO_CONFIG_DEFAULTS.server.port),
			})
			.optional()
			.default({})
	),
	style: z
		.object({
			postcss: z
				.object({
					options: z.any(),
					plugins: z.array(z.any()),
				})
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.style.postcss),
		})
		.optional()
		.default({}),
	markdown: z
		.object({
			drafts: z.boolean().default(false),
			syntaxHighlight: z
				.union([z.literal('shiki'), z.literal('prism'), z.literal(false)])
				.default(ASTRO_CONFIG_DEFAULTS.markdown.syntaxHighlight),
			shikiConfig: z
				.object({
					langs: z.custom<ILanguageRegistration>().array().default([]),
					theme: z
						.enum(BUNDLED_THEMES as [Theme, ...Theme[]])
						.or(z.custom<IThemeRegistration>())
						.default(ASTRO_CONFIG_DEFAULTS.markdown.shikiConfig.theme),
					wrap: z.boolean().or(z.null()).default(ASTRO_CONFIG_DEFAULTS.markdown.shikiConfig.wrap),
				})
				.default({}),
			remarkPlugins: z
				.union([
					z.string(),
					z.tuple([z.string(), z.any()]),
					z.custom<RemarkPlugin>((data) => typeof data === 'function'),
					z.tuple([z.custom<RemarkPlugin>((data) => typeof data === 'function'), z.any()]),
				])
				.array()
				.default(ASTRO_CONFIG_DEFAULTS.markdown.remarkPlugins),
			rehypePlugins: z
				.union([
					z.string(),
					z.tuple([z.string(), z.any()]),
					z.custom<RehypePlugin>((data) => typeof data === 'function'),
					z.tuple([z.custom<RehypePlugin>((data) => typeof data === 'function'), z.any()]),
				])
				.array()
				.default(ASTRO_CONFIG_DEFAULTS.markdown.rehypePlugins),
		})
		.default({}),
	vite: z
		.custom<ViteUserConfig>((data) => data instanceof Object && !Array.isArray(data))
		.default(ASTRO_CONFIG_DEFAULTS.vite),
	legacy: z
		.object({
			astroFlavoredMarkdown: z
				.boolean()
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.legacy.astroFlavoredMarkdown),
		})
		.optional()
		.default({}),
});

/** Turn raw config values into normalized values */
export async function validateConfig(
	userConfig: any,
	root: string,
	cmd: string,
	logging: LogOptions
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
		throw new Error(
			`Legacy configuration detected: "${legacyConfigKey}".\nPlease update your configuration to the new format!\nSee https://astro.build/config for more information.`
		);
	}
	/* eslint-enable no-console */

	// We need to extend the global schema to add transforms that are relative to root.
	// This is type checked against the global schema to make sure we still match.
	const AstroConfigRelativeSchema = AstroConfigSchema.extend({
		root: z
			.string()
			.default(ASTRO_CONFIG_DEFAULTS.root)
			.transform((val) => new URL(appendForwardSlash(val), fileProtocolRoot)),
		srcDir: z
			.string()
			.default(ASTRO_CONFIG_DEFAULTS.srcDir)
			.transform((val) => new URL(appendForwardSlash(val), fileProtocolRoot)),
		publicDir: z
			.string()
			.default(ASTRO_CONFIG_DEFAULTS.publicDir)
			.transform((val) => new URL(appendForwardSlash(val), fileProtocolRoot)),
		outDir: z
			.string()
			.default(ASTRO_CONFIG_DEFAULTS.outDir)
			.transform((val) => new URL(appendForwardSlash(val), fileProtocolRoot)),
		server: z.preprocess(
			// preprocess
			(val) =>
				typeof val === 'function' ? val({ command: cmd === 'dev' ? 'dev' : 'preview' }) : val,
			// validate
			z
				.object({
					host: z
						.union([z.string(), z.boolean()])
						.optional()
						.default(ASTRO_CONFIG_DEFAULTS.server.host),
					port: z.number().optional().default(ASTRO_CONFIG_DEFAULTS.server.port),
					streaming: z.boolean().optional().default(true),
				})
				.optional()
				.default({})
		),
		style: z
			.object({
				postcss: z.preprocess(
					(val) => resolvePostcssConfig(val, fileProtocolRoot),
					z
						.object({
							options: z.any(),
							plugins: z.array(z.any()),
						})
						.optional()
						.default(ASTRO_CONFIG_DEFAULTS.style.postcss)
				),
			})
			.optional()
			.default({}),
	});
	// First-Pass Validation
	const result = {
		...(await AstroConfigRelativeSchema.parseAsync(userConfig)),
		_ctx: {
			pageExtensions: ['.astro', '.md', '.html'],
			scripts: [],
			renderers: [jsxRenderer],
			injectedRoutes: [],
			adapter: undefined,
		},
	};

	// If successful, return the result as a verified AstroConfig object.
	return result;
}

/** Convert the generic "yargs" flag object into our own, custom TypeScript object. */
function resolveFlags(flags: Partial<Flags>): CLIFlags {
	return {
		root: typeof flags.root === 'string' ? flags.root : undefined,
		site: typeof flags.site === 'string' ? flags.site : undefined,
		port: typeof flags.port === 'number' ? flags.port : undefined,
		config: typeof flags.config === 'string' ? flags.config : undefined,
		host:
			typeof flags.host === 'string' || typeof flags.host === 'boolean' ? flags.host : undefined,
		drafts: typeof flags.drafts === 'boolean' ? flags.drafts : false,
	};
}

/** Merge CLI flags & user config object (CLI flags take priority) */
function mergeCLIFlags(astroConfig: AstroUserConfig, flags: CLIFlags, cmd: string) {
	astroConfig.server = astroConfig.server || {};
	astroConfig.markdown = astroConfig.markdown || {};
	if (typeof flags.site === 'string') astroConfig.site = flags.site;
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

interface LoadConfigOptions {
	cwd?: string;
	flags?: Flags;
	cmd: string;
	validate?: boolean;
	logging: LogOptions;
}

/**
 * Resolve the file URL of the user's `astro.config.js|cjs|mjs|ts` file
 * Note: currently the same as loadConfig but only returns the `filePath`
 * instead of the resolved config
 */
export async function resolveConfigURL(
	configOptions: Pick<LoadConfigOptions, 'cwd' | 'flags'>
): Promise<URL | undefined> {
	const root = configOptions.cwd ? path.resolve(configOptions.cwd) : process.cwd();
	const flags = resolveFlags(configOptions.flags || {});
	let userConfigPath: string | undefined;

	if (flags?.config) {
		userConfigPath = /^\.*\//.test(flags.config) ? flags.config : `./${flags.config}`;
		userConfigPath = fileURLToPath(new URL(userConfigPath, `file://${root}/`));
	}

	// Resolve config file path using Proload
	// If `userConfigPath` is `undefined`, Proload will search for `astro.config.[cm]?[jt]s`
	const configPath = await resolve('astro', {
		mustExist: false,
		cwd: root,
		filePath: userConfigPath,
	});
	if (configPath) {
		return pathToFileURL(configPath);
	}
}

interface OpenConfigResult {
	userConfig: AstroUserConfig;
	userConfigPath: string | undefined;
	astroConfig: AstroConfig;
	flags: CLIFlags;
	root: string;
}

/** Load a configuration file, returning both the userConfig and astroConfig */
export async function openConfig(configOptions: LoadConfigOptions): Promise<OpenConfigResult> {
	const root = configOptions.cwd ? path.resolve(configOptions.cwd) : process.cwd();
	const flags = resolveFlags(configOptions.flags || {});
	let userConfig: AstroUserConfig = {};
	let userConfigPath: string | undefined;

	if (flags?.config) {
		userConfigPath = /^\.*\//.test(flags.config) ? flags.config : `./${flags.config}`;
		userConfigPath = fileURLToPath(
			new URL(userConfigPath, appendForwardSlash(pathToFileURL(root).toString()))
		);
	}

	const config = await tryLoadConfig(configOptions, flags, userConfigPath, root);
	if (config) {
		userConfig = config.value;
		userConfigPath = config.filePath;
	}
	const astroConfig = await resolveConfig(
		userConfig,
		root,
		flags,
		configOptions.cmd,
		configOptions.logging
	);

	return {
		astroConfig,
		userConfig,
		userConfigPath,
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
	flags: CLIFlags,
	userConfigPath: string | undefined,
	root: string
): Promise<TryLoadConfigResult | undefined> {
	try {
		// Automatically load config file using Proload
		// If `userConfigPath` is `undefined`, Proload will search for `astro.config.[cm]?[jt]s`
		const config = await load('astro', {
			mustExist: !!userConfigPath,
			cwd: root,
			filePath: userConfigPath,
		});

		return config as TryLoadConfigResult;
	} catch (e) {
		if (e instanceof ProloadError && flags.config) {
			throw new Error(`Unable to resolve --config "${flags.config}"! Does the file exist?`);
		}

		const configURL = await resolveConfigURL(configOptions);
		if (!configURL) {
			throw e;
		}

		// Fallback to use Vite DevServer
		const viteServer = await vite.createServer({
			server: { middlewareMode: true, hmr: false },
			appType: 'custom',
		});
		try {
			const mod = await viteServer.ssrLoadModule(fileURLToPath(configURL));

			if (mod?.default) {
				return {
					value: mod.default,
					filePath: fileURLToPath(configURL),
				};
			}
		} finally {
			await viteServer.close();
		}
	}
}

/**
 * Attempt to load an `astro.config.mjs` file
 * @deprecated
 */
export async function loadConfig(configOptions: LoadConfigOptions): Promise<AstroConfig> {
	const root = configOptions.cwd ? path.resolve(configOptions.cwd) : process.cwd();
	const flags = resolveFlags(configOptions.flags || {});
	let userConfig: AstroUserConfig = {};
	let userConfigPath: string | undefined;

	if (flags?.config) {
		userConfigPath = /^\.*\//.test(flags.config) ? flags.config : `./${flags.config}`;
		userConfigPath = fileURLToPath(
			new URL(userConfigPath, appendForwardSlash(pathToFileURL(root).toString()))
		);
	}

	const config = await tryLoadConfig(configOptions, flags, userConfigPath, root);
	if (config) {
		userConfig = config.value;
	}
	return resolveConfig(userConfig, root, flags, configOptions.cmd, configOptions.logging);
}

/** Attempt to resolve an Astro configuration object. Normalize, validate, and return. */
export async function resolveConfig(
	userConfig: AstroUserConfig,
	root: string,
	flags: CLIFlags = {},
	cmd: string,
	logging: LogOptions
): Promise<AstroConfig> {
	const mergedConfig = mergeCLIFlags(userConfig, flags, cmd);
	const validatedConfig = await validateConfig(mergedConfig, root, cmd, logging);

	return validatedConfig;
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

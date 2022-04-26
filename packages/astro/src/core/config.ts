import type { AstroConfig, AstroUserConfig, CLIFlags } from '../@types/astro';
import type { Arguments as Flags } from 'yargs-parser';
import type * as Postcss from 'postcss';
import type { ILanguageRegistration, IThemeRegistration, Theme } from 'shiki';
import type { RemarkPlugin, RehypePlugin } from '@astrojs/markdown-remark';

import * as colors from 'kleur/colors';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { mergeConfig as mergeViteConfig } from 'vite';
import { BUNDLED_THEMES } from 'shiki';
import { z } from 'zod';
import load, { resolve, ProloadError } from '@proload/core';
import loadTypeScript from '@proload/plugin-tsm';
import postcssrc from 'postcss-load-config';
import { arraify, isObject } from './util.js';
import { appendForwardSlash, trimSlashes } from './path.js';

load.use([loadTypeScript]);

interface PostCSSConfigResult {
	options: Postcss.ProcessOptions;
	plugins: Postcss.Plugin[];
}

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
	'experimentalIntegrations',
]);

export const AstroConfigSchema = z.object({
	adapter: z.object({ name: z.string(), hooks: z.object({}).passthrough().default({}) }).optional(),
	root: z
		.string()
		.optional()
		.default('.')
		.transform((val) => new URL(val)),
	srcDir: z
		.string()
		.optional()
		.default('./src')
		.transform((val) => new URL(val)),
	publicDir: z
		.string()
		.optional()
		.default('./public')
		.transform((val) => new URL(val)),
	outDir: z
		.string()
		.optional()
		.default('./dist')
		.transform((val) => new URL(val)),
	site: z
		.string()
		.url()
		.optional()
		.transform((val) => (val ? appendForwardSlash(val) : val))
		.refine((val) => !val || new URL(val).pathname.length <= 1, {
			message:
				'"site" must be a valid URL origin (ex: "https://example.com") but cannot contain a URL path (ex: "https://example.com/blog"). Use "base" to configure your deployed URL path',
		}),
	base: z
		.string()
		.optional()
		.default('/')
		.transform((val) => appendForwardSlash(trimSlashes(val))),
	trailingSlash: z
		.union([z.literal('always'), z.literal('never'), z.literal('ignore')])
		.optional()
		.default('ignore'),
	build: z
		.object({
			format: z
				.union([z.literal('file'), z.literal('directory')])
				.optional()
				.default('directory'),
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
				host: z.union([z.string(), z.boolean()]).optional().default(false),
				port: z.number().optional().default(3000),
			})
			.optional()
			.default({})
	),
	integrations: z.preprocess(
		// preprocess
		(val) => (Array.isArray(val) ? val.flat(Infinity).filter(Boolean) : val),
		// validate
		z
			.array(z.object({ name: z.string(), hooks: z.object({}).passthrough().default({}) }))
			.default([])
	),
	style: z
		.object({
			postcss: z
				.object({
					options: z.any(),
					plugins: z.array(z.any()),
				})
				.optional()
				.default({ options: {}, plugins: [] }),
		})
		.optional()
		.default({}),
	markdown: z
		.object({
			// NOTE: "mdx" allows us to parse/compile Astro components in markdown.
			// TODO: This should probably be updated to something more like "md" | "astro"
			mode: z.enum(['md', 'mdx']).default('mdx'),
			drafts: z.boolean().default(false),
			syntaxHighlight: z
				.union([z.literal('shiki'), z.literal('prism'), z.literal(false)])
				.default('shiki'),
			shikiConfig: z
				.object({
					langs: z.custom<ILanguageRegistration>().array().default([]),
					theme: z
						.enum(BUNDLED_THEMES as [Theme, ...Theme[]])
						.or(z.custom<IThemeRegistration>())
						.default('github-dark'),
					wrap: z.boolean().or(z.null()).default(false),
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
				.default([]),
			rehypePlugins: z
				.union([
					z.string(),
					z.tuple([z.string(), z.any()]),
					z.custom<RehypePlugin>((data) => typeof data === 'function'),
					z.tuple([z.custom<RehypePlugin>((data) => typeof data === 'function'), z.any()]),
				])
				.array()
				.default([]),
		})
		.default({}),
	vite: z.any().optional().default({}),
	experimental: z
		.object({
			ssr: z.boolean().optional().default(false),
			integrations: z.boolean().optional().default(false),
		})
		.optional()
		.default({}),
});

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
			.default('.')
			.transform((val) => new URL(appendForwardSlash(val), fileProtocolRoot)),
		srcDir: z
			.string()
			.default('./src')
			.transform((val) => new URL(appendForwardSlash(val), fileProtocolRoot)),
		publicDir: z
			.string()
			.default('./public')
			.transform((val) => new URL(appendForwardSlash(val), fileProtocolRoot)),
		outDir: z
			.string()
			.default('./dist')
			.transform((val) => new URL(appendForwardSlash(val), fileProtocolRoot)),
		server: z.preprocess(
			// preprocess
			(val) =>
				typeof val === 'function' ? val({ command: cmd === 'dev' ? 'dev' : 'preview' }) : val,
			// validate
			z
				.object({
					host: z.union([z.string(), z.boolean()]).optional().default(false),
					port: z.number().optional().default(3000),
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
						.default({ options: {}, plugins: [] })
				),
			})
			.optional()
			.default({}),
	});
	// First-Pass Validation
	const result = {
		...(await AstroConfigRelativeSchema.parseAsync(userConfig)),
		_ctx: { scripts: [], renderers: [], adapter: undefined },
	};
	// Final-Pass Validation (perform checks that require the full config object)
	if (
		!result.experimental?.integrations &&
		!result.integrations.every((int) => int.name.startsWith('@astrojs/'))
	) {
		throw new Error(
			[
				`Astro integrations are still experimental.`,
				``,
				`Only official "@astrojs/*" integrations are currently supported.`,
				`To enable 3rd-party integrations, use the "--experimental-integrations" flag.`,
				`Breaking changes may occur in this API before Astro v1.0 is released.`,
				``,
			].join('\n')
		);
	}
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
		experimentalSsr: typeof flags.experimentalSsr === 'boolean' ? flags.experimentalSsr : undefined,
		experimentalIntegrations:
			typeof flags.experimentalIntegrations === 'boolean'
				? flags.experimentalIntegrations
				: undefined,
		drafts: typeof flags.drafts === 'boolean' ? flags.drafts : false,
	};
}

/** Merge CLI flags & user config object (CLI flags take priority) */
function mergeCLIFlags(astroConfig: AstroUserConfig, flags: CLIFlags, cmd: string) {
	astroConfig.server = astroConfig.server || {};
	astroConfig.experimental = astroConfig.experimental || {};
	astroConfig.markdown = astroConfig.markdown || {};
	if (typeof flags.site === 'string') astroConfig.site = flags.site;
	if (typeof flags.experimentalSsr === 'boolean')
		astroConfig.experimental.ssr = flags.experimentalSsr;
	if (typeof flags.experimentalIntegrations === 'boolean')
		astroConfig.experimental.integrations = flags.experimentalIntegrations;
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

/** Attempt to load an `astro.config.mjs` file */
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

	// Automatically load config file using Proload
	// If `userConfigPath` is `undefined`, Proload will search for `astro.config.[cm]?[jt]s`
	let config;
	try {
		config = await load('astro', {
			mustExist: !!userConfigPath,
			cwd: root,
			filePath: userConfigPath,
		});
	} catch (err) {
		if (err instanceof ProloadError && flags.config) {
			throw new Error(`Unable to resolve --config "${flags.config}"! Does the file exist?`);
		}
		throw err;
	}
	if (config) {
		userConfig = config.value;
	}
	return resolveConfig(userConfig, root, flags, configOptions.cmd);
}

/** Attempt to resolve an Astro configuration object. Normalize, validate, and return. */
export async function resolveConfig(
	userConfig: AstroUserConfig,
	root: string,
	flags: CLIFlags = {},
	cmd: string
): Promise<AstroConfig> {
	const mergedConfig = mergeCLIFlags(userConfig, flags, cmd);
	const validatedConfig = await validateConfig(mergedConfig, root, cmd);

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

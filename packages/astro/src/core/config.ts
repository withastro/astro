import type { AstroConfig, AstroUserConfig, CLIFlags } from '../@types/astro';
import type { Arguments as Flags } from 'yargs-parser';
import type * as Postcss from 'postcss';

import * as colors from 'kleur/colors';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { mergeConfig as mergeViteConfig } from 'vite';
import { z } from 'zod';
import load from '@proload/core';
import loadTypeScript from '@proload/plugin-tsm';
import postcssrc from 'postcss-load-config';
import { arraify, isObject, flatten } from './util.js';
import { dset } from 'dset';

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

export const LegacyAstroConfigSchema = z.object({
	projectRoot: z
		.string()
		.optional()
		.default('.')
		.transform((val) => new URL(val)),
	src: z
		.string()
		.optional()
		.default('./src')
		.transform((val) => new URL(val)),
	pages: z
		.string()
		.optional()
		.default('./src/pages')
		.transform((val) => new URL(val)),
	public: z
		.string()
		.optional()
		.default('./public')
		.transform((val) => new URL(val)),
	dist: z
		.string()
		.optional()
		.default('./dist')
		.transform((val) => new URL(val)),
	styleOptions: z
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
	markdownOptions: z
		.object({
			render: z.any().optional().default(['@astrojs/markdown-remark', {}]),
		})
		.strict()
		.optional()
		.default({}),
	buildOptions: z
		.object({
			site: z
				.string()
				.optional()
				.transform((val) => (val ? addTrailingSlash(val) : val)),
			sitemapFilter: z.function().optional(),
			sitemap: z.boolean().optional().default(true),
			pageUrlFormat: z
				.union([z.literal('file'), z.literal('directory')])
				.optional()
				.default('directory'),
			legacyBuild: z.boolean().optional().default(false),
			experimentalStaticBuild: z.boolean().optional().default(true),
			experimentalSsr: z.boolean().optional().default(false),
			drafts: z.boolean().optional().default(false),
		})
		.optional()
		.default({}),
	devOptions: z
		.object({
			host: z.union([z.string(), z.boolean()]).optional().default(false),
			port: z.number().optional().default(3000),
			trailingSlash: z
				.union([z.literal('always'), z.literal('never'), z.literal('ignore')])
				.optional()
				.default('ignore'),
		})
		.optional()
		.default({}),
	experimentalIntegrations: z.boolean().optional().default(false),
});

export const AstroConfigSchema = z.object({
	adapter: z.object({ name: z.string(), hooks: z.object({}).passthrough().default({}) }).optional(),
	logLevel: z
		.union([z.literal('error'), z.literal('warn'), z.literal('info'), z.literal('silent')])
		.optional()
		.default('info'),
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
		.optional()
		.transform((val) => (val ? addTrailingSlash(val) : val)),
	base: z.string().optional().default('/'),
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
	server: z
		.object({
			host: z.union([z.string(), z.boolean()]).optional().default(false),
			port: z.number().optional().default(3000),
		})
		.or(
			z
				.function()
				.args(
					z
						.object({
							command: z.union([z.literal('dev'), z.literal('preview')]).optional(),
						})
						.optional()
				)
				.returns(
					z.object({
						host: z.union([z.string(), z.boolean()]).optional().default(false),
						port: z.number().optional().default(3000),
					})
				)
		)
		.optional()
		.default({}),
	integrations: z.preprocess(
		// preprocess
		(val) => (Array.isArray(val) ? val.flat(Infinity).filter(Boolean) : val),
		// validate
		z.array(z.object({ name: z.string(), hooks: z.object({}).passthrough().default({}) })).default([])
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
			drafts: z.boolean().optional().default(false),
			mode: z
				.union([z.literal('md'), z.literal('mdx')])
				.optional()
				.default('md'),
			syntaxHighlight: z
				.union([z.literal('shiki'), z.literal('prism'), z.literal(false)])
				.optional()
				.default('shiki'),
			// TODO: add better type checking
			shikiConfig: z.any().optional().default({}),
			remarkPlugins: z.array(z.any()).optional().default([]),
			rehypePlugins: z.array(z.any()).optional().default([]),
		})
		.passthrough()
		.optional()
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

const configMigrationMap = new Map<string, any>([
	['projectRoot', 'root'], // ✅
	['src', 'srcDir'],
	['pages', null],
	['public', 'publicDir'], // ✅
	['dist', 'outDir'], // ✅
	['integrations', 'integrations'], // ✅
	['adapter', 'adapter'], // ✅
	['styleOptions', 'style'], // ✅
	['markdownOptions.render.0', null],
	['markdownOptions.render.1', 'markdown'],
	['buildOptions', 'build'],
	['buildOptions.site', 'site'], // ✅
	['buildOptions.sitemapFilter', null],
	['buildOptions.sitemap', null],
	['buildOptions.pageUrlFormat', 'build.format'], // ✅
	['buildOptions.legacyBuild', null], // ✅
	['buildOptions.experimentalStaticBuild', null], // ✅
	['experimental.ssr', 'experimental.ssr'],
	['buildOptions.drafts', 'markdown.drafts'],
	['devOptions', null],
	['devOptions.host', 'server.host'], // ✅
	['devOptions.port', 'server.port'], // ✅
	['devOptions.trailingSlash', 'trailingSlash'],
	['experimentalIntegrations', 'experimental.integrations'],
]);

function migrateConfig(legacyConfig: ReturnType<typeof LegacyAstroConfigSchema['parse']>) {
	const flat = flatten(legacyConfig);
	const newConfig: Record<string, any> = {};
	const instructions = [];
	outer: for (let [key, value] of Object.entries(flat)) {
		for (const k of configMigrationMap.keys()) {
			if (key.startsWith(k)) {
				const newKey = configMigrationMap.get(k);
				if (newKey) {
					key = key.replace(k, newKey);
				} else {
					instructions.push(`${key} has been removed`);
					continue outer;
				}
			}
		}
		dset(newConfig, key, value);
	}
	return newConfig;
}

/** Turn raw config values into normalized values */
export async function validateConfig(userConfig: any, root: string): Promise<AstroConfig> {
	const fileProtocolRoot = pathToFileURL(root + path.sep);
	// Manual deprecation checks
	/* eslint-disable no-console */
	if (userConfig.hasOwnProperty('renderers')) {
		console.error('Astro "renderers" are now "integrations"!');
		console.error('Update your configuration and install new dependencies:');
		try {
			const rendererKeywords = userConfig.renderers.map((r: string) => r.replace('@astrojs/renderer-', ''));
			const rendererImports = rendererKeywords.map((r: string) => `  import ${r} from '@astrojs/${r === 'solid' ? 'solid-js' : r}';`).join('\n');
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

	const LegacyAstroConfigRelativeSchema = LegacyAstroConfigSchema.extend({
		projectRoot: z
			.string()
			.default('.')
			.transform((val) => new URL(addTrailingSlash(val), fileProtocolRoot)),
		src: z
			.string()
			.default('./src')
			.transform((val) => new URL(addTrailingSlash(val), fileProtocolRoot)),
		pages: z
			.string()
			.default('./src/pages')
			.transform((val) => new URL(addTrailingSlash(val), fileProtocolRoot)),
		public: z
			.string()
			.default('./public')
			.transform((val) => new URL(addTrailingSlash(val), fileProtocolRoot)),
		dist: z
			.string()
			.default('./dist')
			.transform((val) => new URL(addTrailingSlash(val), fileProtocolRoot)),
		styleOptions: z
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

	let oldConfig;
	try {
		oldConfig = await LegacyAstroConfigRelativeSchema.parseAsync(userConfig);
	} catch (e) {}
	if (oldConfig) {
		console.error('Astro configuration has changed in v1.0.0!');
		console.error('Update your configuration:');
		try {
			const newConfig = migrateConfig(userConfig);
			console.log(JSON.stringify(newConfig));
		} catch (err) {
			// We tried, better to just exit.
		}
		process.exit(1);
	}
	/* eslint-enable no-console */

	// We need to extend the global schema to add transforms that are relative to root.
	// This is type checked against the global schema to make sure we still match.
	const AstroConfigRelativeSchema = AstroConfigSchema.extend({
		root: z
			.string()
			.default('.')
			.transform((val) => new URL(addTrailingSlash(val), fileProtocolRoot)),
		srcDir: z
			.string()
			.default('./src')
			.transform((val) => new URL(addTrailingSlash(val), fileProtocolRoot)),
		publicDir: z
			.string()
			.default('./public')
			.transform((val) => new URL(addTrailingSlash(val), fileProtocolRoot)),
		outDir: z
			.string()
			.default('./dist')
			.transform((val) => new URL(addTrailingSlash(val), fileProtocolRoot)),
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
	if (!result.experimental?.integrations && !result.integrations.every((int) => int.name.startsWith('@astrojs/'))) {
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

/** Adds '/' to end of string but doesn’t double-up */
function addTrailingSlash(str: string): string {
	return str.replace(/\/*$/, '/');
}

/** Convert the generic "yargs" flag object into our own, custom TypeScript object. */
function resolveFlags(flags: Partial<Flags>): CLIFlags {
	return {
		root: typeof flags.root === 'string' ? flags.root : undefined,
		site: typeof flags.site === 'string' ? flags.site : undefined,
		port: typeof flags.port === 'number' ? flags.port : undefined,
		config: typeof flags.config === 'string' ? flags.config : undefined,
		host: typeof flags.host === 'string' || typeof flags.host === 'boolean' ? flags.host : undefined,
		experimentalSsr: typeof flags.experimentalSsr === 'boolean' ? flags.experimentalSsr : false,
		experimentalIntegrations: typeof flags.experimentalIntegrations === 'boolean' ? flags.experimentalIntegrations : false,
		drafts: typeof flags.drafts === 'boolean' ? flags.drafts : false,
	};
}

/** Merge CLI flags & user config object (CLI flags take priority) */
function mergeCLIFlags(astroConfig: AstroUserConfig, flags: CLIFlags) {
	astroConfig.buildOptions = astroConfig.buildOptions || {};
	astroConfig.devOptions = astroConfig.devOptions || {};
	if (typeof flags.site === 'string') astroConfig.buildOptions.site = flags.site;
	if (typeof flags.port === 'number') astroConfig.devOptions.port = flags.port;
	if (typeof flags.host === 'string' || typeof flags.host === 'boolean') astroConfig.devOptions.host = flags.host;
	if (typeof flags.experimentalSsr === 'boolean') {
		astroConfig.buildOptions.experimentalSsr = flags.experimentalSsr;
	}
	if (typeof flags.experimentalIntegrations === 'boolean') astroConfig.experimentalIntegrations = flags.experimentalIntegrations;
	if (typeof flags.drafts === 'boolean') astroConfig.buildOptions.drafts = flags.drafts;
	return astroConfig;
}

interface LoadConfigOptions {
	cwd?: string;
	flags?: Flags;
}

/**
 * Resolve the file URL of the user's `astro.config.js|cjs|mjs|ts` file
 * Note: currently the same as loadConfig but only returns the `filePath`
 * instead of the resolved config
 */
export async function resolveConfigURL(configOptions: LoadConfigOptions): Promise<URL | undefined> {
	const root = configOptions.cwd ? path.resolve(configOptions.cwd) : process.cwd();
	const flags = resolveFlags(configOptions.flags || {});
	let userConfigPath: string | undefined;

	if (flags?.config) {
		userConfigPath = /^\.*\//.test(flags.config) ? flags.config : `./${flags.config}`;
		userConfigPath = fileURLToPath(new URL(userConfigPath, `file://${root}/`));
	}
	// Automatically load config file using Proload
	// If `userConfigPath` is `undefined`, Proload will search for `astro.config.[cm]?[jt]s`
	const config = await load('astro', { mustExist: false, cwd: root, filePath: userConfigPath });
	if (config) {
		return pathToFileURL(config.filePath);
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
		userConfigPath = fileURLToPath(new URL(userConfigPath, pathToFileURL(root)));
	}
	// Automatically load config file using Proload
	// If `userConfigPath` is `undefined`, Proload will search for `astro.config.[cm]?[jt]s`
	const config = await load('astro', { mustExist: false, cwd: root, filePath: userConfigPath });
	if (config) {
		userConfig = config.value;
	}
	return resolveConfig(userConfig, root, flags);
}

/** Attempt to resolve an Astro configuration object. Normalize, validate, and return. */
export async function resolveConfig(userConfig: AstroUserConfig, root: string, flags: CLIFlags = {}): Promise<AstroConfig> {
	const validatedConfig = await validateConfig(userConfig, root);
	const mergedConfig = mergeCLIFlags(validatedConfig, flags);
	console.log(mergedConfig);

	return validatedConfig;
}

function mergeConfigRecursively(defaults: Record<string, any>, overrides: Record<string, any>, rootPath: string) {
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

export function mergeConfig(defaults: Record<string, any>, overrides: Record<string, any>, isRoot = true): Record<string, any> {
	return mergeConfigRecursively(defaults, overrides, isRoot ? '' : '.');
}

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
import { arraify, isObject } from './util.js';

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

export const AstroConfigSchema = z.object({
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
	integrations: z.preprocess(
		// preprocess
		(val) => (Array.isArray(val) ? val.flat(Infinity).filter(Boolean) : val),
		// validate
		z
			.array(z.object({ name: z.string(), hooks: z.object({}).passthrough().default({}) }))
			.default([])
			// validate: first-party integrations only
			// TODO: Add `To use 3rd-party integrations or to create your own, use the --experimental-integrations flag.`,
			.refine((arr) => arr.every((integration) => integration.name.startsWith('@astrojs/')), {
				message: `Astro integrations are still experimental, and only official integrations are currently supported`,
			})
	),
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
			hostname: z.string().optional().default('localhost'),
			port: z.number().optional().default(3000),
			trailingSlash: z
				.union([z.literal('always'), z.literal('never'), z.literal('ignore')])
				.optional()
				.default('ignore'),
		})
		.optional()
		.default({}),
	vite: z.any().optional().default({}), // TODO: we don’t need validation, but can we get better type inference?
});

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
			const rendererImports = rendererKeywords.map((r: string) => `  import ${r} from '@astrojs/${r}';`).join('\n');
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
	/* eslint-enable no-console */

	// We need to extend the global schema to add transforms that are relative to root.
	// This is type checked against the global schema to make sure we still match.
	const AstroConfigRelativeSchema = AstroConfigSchema.extend({
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
	return {
		...(await AstroConfigRelativeSchema.parseAsync(userConfig)),
		_ctx: { scripts: [], renderers: [] },
	};
}

/** Adds '/' to end of string but doesn’t double-up */
function addTrailingSlash(str: string): string {
	return str.replace(/\/*$/, '/');
}

/** Convert the generic "yargs" flag object into our own, custom TypeScript object. */
function resolveFlags(flags: Partial<Flags>): CLIFlags {
	if (flags.experimentalStaticBuild) {
		// eslint-disable-next-line no-console
		console.warn(`Passing --experimental-static-build is no longer necessary and is now the default. The flag will be removed in a future version of Astro.`);
	}
	return {
		projectRoot: typeof flags.projectRoot === 'string' ? flags.projectRoot : undefined,
		site: typeof flags.site === 'string' ? flags.site : undefined,
		sitemap: typeof flags.sitemap === 'boolean' ? flags.sitemap : undefined,
		port: typeof flags.port === 'number' ? flags.port : undefined,
		config: typeof flags.config === 'string' ? flags.config : undefined,
		hostname: typeof flags.hostname === 'string' ? flags.hostname : undefined,
		host: typeof flags.host === 'string' || typeof flags.host === 'boolean' ? flags.host : undefined,
		legacyBuild: typeof flags.legacyBuild === 'boolean' ? flags.legacyBuild : false,
		experimentalSsr: typeof flags.experimentalSsr === 'boolean' ? flags.experimentalSsr : false,
		drafts: typeof flags.drafts === 'boolean' ? flags.drafts : false,
	};
}

/** Merge CLI flags & user config object (CLI flags take priority) */
function mergeCLIFlags(astroConfig: AstroUserConfig, flags: CLIFlags) {
	astroConfig.buildOptions = astroConfig.buildOptions || {};
	astroConfig.devOptions = astroConfig.devOptions || {};
	if (typeof flags.sitemap === 'boolean') astroConfig.buildOptions.sitemap = flags.sitemap;
	if (typeof flags.site === 'string') astroConfig.buildOptions.site = flags.site;
	if (typeof flags.port === 'number') astroConfig.devOptions.port = flags.port;
	if (typeof flags.host === 'string' || typeof flags.host === 'boolean') astroConfig.devOptions.host = flags.host;
	if (typeof flags.hostname === 'string') astroConfig.devOptions.hostname = flags.hostname;
	if (typeof flags.legacyBuild === 'boolean') astroConfig.buildOptions.legacyBuild = flags.legacyBuild;
	if (typeof flags.experimentalSsr === 'boolean') {
		astroConfig.buildOptions.experimentalSsr = flags.experimentalSsr;
		if (flags.experimentalSsr) {
			astroConfig.buildOptions.legacyBuild = false;
		}
	}
	if (typeof flags.drafts === 'boolean') astroConfig.buildOptions.drafts = flags.drafts;
	return astroConfig;
}

interface LoadConfigOptions {
	cwd?: string;
	flags?: Flags;
}

/** Attempt to load an `astro.config.mjs` file */
export async function loadConfig(configOptions: LoadConfigOptions): Promise<AstroConfig> {
	const root = configOptions.cwd ? path.resolve(configOptions.cwd) : process.cwd();
	const flags = resolveFlags(configOptions.flags || {});
	let userConfig: AstroUserConfig = {};
	let userConfigPath: string | undefined;

	if (flags?.config) {
		userConfigPath = /^\.*\//.test(flags.config) ? flags.config : `./${flags.config}`;
		userConfigPath = fileURLToPath(new URL(userConfigPath, `file://${root}/`));
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
	const mergedConfig = mergeCLIFlags(userConfig, flags);
	const validatedConfig = await validateConfig(mergedConfig, root);
	return validatedConfig;
}

export function formatConfigError(err: z.ZodError) {
	const errorList = err.issues.map((issue) => `  ! ${colors.bold(issue.path.join('.'))}  ${colors.red(issue.message + '.')}`);
	return `${colors.red('[config]')} Astro found issue(s) with your configuration:\n${errorList.join('\n')}`;
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

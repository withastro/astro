import type { AstroConfig, AstroUserConfig, CLIFlags } from '../@types/astro';
import type { Arguments as Flags } from 'yargs-parser';

import * as colors from 'kleur/colors';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { z } from 'zod';
import load from '@proload/core';
import loadTypeScript from '@proload/plugin-tsm';

load.use([loadTypeScript]);

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
	renderers: z.array(z.string()).optional().default(['@astrojs/renderer-svelte', '@astrojs/renderer-vue', '@astrojs/renderer-react', '@astrojs/renderer-preact']),
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
	});
	return AstroConfigRelativeSchema.parseAsync(userConfig);
}

/** Adds '/' to end of string but doesn’t double-up */
function addTrailingSlash(str: string): string {
	return str.replace(/\/*$/, '/');
}

/** Convert the generic "yargs" flag object into our own, custom TypeScript object. */
function resolveFlags(flags: Partial<Flags>): CLIFlags {
	if(flags.experimentalStaticBuild) {
		// eslint-disable-next-line no-console
		console.warn(`Passing --experimental-static-build is no longer necessary and is now the default. The flag will be removed in a future version of Astro.`)
	}

	return {
		projectRoot: typeof flags.projectRoot === 'string' ? flags.projectRoot : undefined,
		site: typeof flags.site === 'string' ? flags.site : undefined,
		sitemap: typeof flags.sitemap === 'boolean' ? flags.sitemap : undefined,
		port: typeof flags.port === 'number' ? flags.port : undefined,
		config: typeof flags.config === 'string' ? flags.config : undefined,
		hostname: typeof flags.hostname === 'string' ? flags.hostname : undefined,
		legacyBuild: typeof flags.legacyBuild === 'boolean' ? flags.legacyBuild : false,
		experimentalStaticBuild: typeof flags.experimentalStaticBuild === 'boolean' ? flags.experimentalStaticBuild : true,
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
	if (typeof flags.hostname === 'string') astroConfig.devOptions.hostname = flags.hostname;
	if (typeof flags.experimentalStaticBuild === 'boolean') astroConfig.buildOptions.experimentalStaticBuild = flags.experimentalStaticBuild;
	if (typeof flags.experimentalSsr === 'boolean') {
		astroConfig.buildOptions.experimentalSsr = flags.experimentalSsr;
		if (flags.experimentalSsr) {
			astroConfig.buildOptions.experimentalStaticBuild = true;
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
	// normalize, validate, and return
	const mergedConfig = mergeCLIFlags(userConfig, flags);
	const validatedConfig = await validateConfig(mergedConfig, root);
	return validatedConfig;
}

export function formatConfigError(err: z.ZodError) {
	const errorList = err.issues.map((issue) => `  ! ${colors.bold(issue.path.join('.'))}  ${colors.red(issue.message + '.')}`);
	return `${colors.red('[config]')} Astro found issue(s) with your configuration:\n${errorList.join('\n')}`;
}

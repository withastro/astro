import type { RehypePlugin, RemarkPlugin, RemarkRehype } from '@astrojs/markdown-remark';
import type * as Postcss from 'postcss';
import type { ILanguageRegistration, IThemeRegistration, Theme } from 'shiki';
import type { AstroUserConfig, ViteUserConfig } from '../../@types/astro';

import postcssrc from 'postcss-load-config';
import { BUNDLED_THEMES } from 'shiki';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { appendForwardSlash, prependForwardSlash, trimSlashes } from '../path.js';
import { isObject } from '../util.js';

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
		remarkRehype: {},
	},
	vite: {},
	legacy: {
		astroFlavoredMarkdown: false,
	},
};

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
			remarkRehype: z
				.custom<RemarkRehype>((data) => data instanceof Object && !Array.isArray(data))
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.markdown.remarkRehype),
			extendDefaultPlugins: z.boolean().default(false),
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

export function createRelativeSchema(cmd: string, fileProtocolRoot: URL) {
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

	return AstroConfigRelativeSchema;
}

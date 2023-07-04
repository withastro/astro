import type { RehypePlugin, RemarkPlugin, RemarkRehype } from '@astrojs/markdown-remark';
import { markdownConfigDefaults } from '@astrojs/markdown-remark';
import type { ILanguageRegistration, IThemeRegistration, Theme } from 'shiki';
import type { AstroUserConfig, ViteUserConfig } from '../../@types/astro';

import type { OutgoingHttpHeaders } from 'http';
import { BUNDLED_THEMES } from 'shiki';
import { z } from 'zod';
import { appendForwardSlash, prependForwardSlash, trimSlashes } from '../path.js';

const ASTRO_CONFIG_DEFAULTS = {
	root: '.',
	srcDir: './src',
	publicDir: './public',
	outDir: './dist',
	cacheDir: './node_modules/.astro',
	base: '/',
	trailingSlash: 'ignore',
	build: {
		format: 'directory',
		client: './dist/client/',
		server: './dist/server/',
		assets: '_astro',
		serverEntry: 'entry.mjs',
		redirects: true,
		inlineStylesheets: 'never',
		split: false,
		excludeMiddleware: false,
	},
	compressHTML: false,
	server: {
		host: false,
		port: 3000,
		open: false,
	},
	integrations: [],
	markdown: {
		drafts: false,
		...markdownConfigDefaults,
	},
	vite: {},
	legacy: {},
	redirects: {},
	experimental: {
		assets: false,
		redirects: false,
	},
} satisfies AstroUserConfig & { server: { open: boolean } };

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
	cacheDir: z
		.string()
		.optional()
		.default(ASTRO_CONFIG_DEFAULTS.cacheDir)
		.transform((val) => new URL(val)),
	site: z.string().url().optional(),
	compressHTML: z.boolean().optional().default(ASTRO_CONFIG_DEFAULTS.compressHTML),
	base: z.string().optional().default(ASTRO_CONFIG_DEFAULTS.base),
	trailingSlash: z
		.union([z.literal('always'), z.literal('never'), z.literal('ignore')])
		.optional()
		.default(ASTRO_CONFIG_DEFAULTS.trailingSlash),
	output: z
		.union([z.literal('static'), z.literal('server'), z.literal('hybrid')])
		.optional()
		.default('static'),
	scopedStyleStrategy: z
		.union([z.literal('where'), z.literal('class')])
		.optional()
		.default('where'),
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
			client: z
				.string()
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.build.client)
				.transform((val) => new URL(val)),
			server: z
				.string()
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.build.server)
				.transform((val) => new URL(val)),
			assets: z.string().optional().default(ASTRO_CONFIG_DEFAULTS.build.assets),
			assetsPrefix: z.string().optional(),
			serverEntry: z.string().optional().default(ASTRO_CONFIG_DEFAULTS.build.serverEntry),
			redirects: z.boolean().optional().default(ASTRO_CONFIG_DEFAULTS.build.redirects),
			inlineStylesheets: z
				.enum(['always', 'auto', 'never'])
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.build.inlineStylesheets),

			split: z.boolean().optional().default(ASTRO_CONFIG_DEFAULTS.build.split),
			excludeMiddleware: z
				.boolean()
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.build.excludeMiddleware),
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
				open: z.boolean().optional().default(ASTRO_CONFIG_DEFAULTS.server.open),
				host: z
					.union([z.string(), z.boolean()])
					.optional()
					.default(ASTRO_CONFIG_DEFAULTS.server.host),
				port: z.number().optional().default(ASTRO_CONFIG_DEFAULTS.server.port),
				headers: z.custom<OutgoingHttpHeaders>().optional(),
			})
			.optional()
			.default({})
	),
	redirects: z.record(z.string(), z.string()).default(ASTRO_CONFIG_DEFAULTS.redirects),
	image: z
		.object({
			service: z.object({
				entrypoint: z.union([
					z.literal('astro/assets/services/sharp'),
					z.literal('astro/assets/services/squoosh'),
					z.string(),
				]),
				config: z.record(z.any()).default({}),
			}),
		})
		.default({
			service: { entrypoint: 'astro/assets/services/squoosh', config: {} },
		}),
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
						.default(ASTRO_CONFIG_DEFAULTS.markdown.shikiConfig.theme!),
					wrap: z.boolean().or(z.null()).default(ASTRO_CONFIG_DEFAULTS.markdown.shikiConfig.wrap!),
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
			gfm: z.boolean().default(ASTRO_CONFIG_DEFAULTS.markdown.gfm),
			smartypants: z.boolean().default(ASTRO_CONFIG_DEFAULTS.markdown.smartypants),
		})
		.default({}),
	vite: z
		.custom<ViteUserConfig>((data) => data instanceof Object && !Array.isArray(data))
		.default(ASTRO_CONFIG_DEFAULTS.vite),
	experimental: z
		.object({
			assets: z.boolean().optional().default(ASTRO_CONFIG_DEFAULTS.experimental.assets),
			redirects: z.boolean().optional().default(ASTRO_CONFIG_DEFAULTS.experimental.redirects),
		})
		.passthrough()
		.refine(
			(d) => {
				const validKeys = Object.keys(ASTRO_CONFIG_DEFAULTS.experimental);
				const invalidKeys = Object.keys(d).filter((key) => !validKeys.includes(key));
				if (invalidKeys.length > 0) return false;
				return true;
			},
			(d) => {
				const validKeys = Object.keys(ASTRO_CONFIG_DEFAULTS.experimental);
				const invalidKeys = Object.keys(d).filter((key) => !validKeys.includes(key));
				return {
					message: `Invalid experimental key: \`${invalidKeys.join(
						', '
					)}\`. \nMake sure the spelling is correct, and that your Astro version supports this experiment.\nSee https://docs.astro.build/en/reference/configuration-reference/#experimental-flags for more information.`,
				};
			}
		)
		.optional()
		.default({}),
	legacy: z.object({}).optional().default({}),
});

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
		compressHTML: z.boolean().optional().default(ASTRO_CONFIG_DEFAULTS.compressHTML),
		publicDir: z
			.string()
			.default(ASTRO_CONFIG_DEFAULTS.publicDir)
			.transform((val) => new URL(appendForwardSlash(val), fileProtocolRoot)),
		outDir: z
			.string()
			.default(ASTRO_CONFIG_DEFAULTS.outDir)
			.transform((val) => new URL(appendForwardSlash(val), fileProtocolRoot)),
		cacheDir: z
			.string()
			.default(ASTRO_CONFIG_DEFAULTS.cacheDir)
			.transform((val) => new URL(appendForwardSlash(val), fileProtocolRoot)),
		build: z
			.object({
				format: z
					.union([z.literal('file'), z.literal('directory')])
					.optional()
					.default(ASTRO_CONFIG_DEFAULTS.build.format),
				client: z
					.string()
					.optional()
					.default(ASTRO_CONFIG_DEFAULTS.build.client)
					.transform((val) => new URL(val, fileProtocolRoot)),
				server: z
					.string()
					.optional()
					.default(ASTRO_CONFIG_DEFAULTS.build.server)
					.transform((val) => new URL(val, fileProtocolRoot)),
				assets: z.string().optional().default(ASTRO_CONFIG_DEFAULTS.build.assets),
				assetsPrefix: z.string().optional(),
				serverEntry: z.string().optional().default(ASTRO_CONFIG_DEFAULTS.build.serverEntry),
				redirects: z.boolean().optional().default(ASTRO_CONFIG_DEFAULTS.build.redirects),
				inlineStylesheets: z
					.enum(['always', 'auto', 'never'])
					.optional()
					.default(ASTRO_CONFIG_DEFAULTS.build.inlineStylesheets),

				split: z.boolean().optional().default(ASTRO_CONFIG_DEFAULTS.build.split),
				excludeMiddleware: z
					.boolean()
					.optional()
					.default(ASTRO_CONFIG_DEFAULTS.build.excludeMiddleware),
			})
			.optional()
			.default({}),
		server: z.preprocess(
			// preprocess
			(val) => {
				if (typeof val === 'function') {
					const result = val({ command: cmd === 'dev' ? 'dev' : 'preview' });
					// @ts-expect-error revive attached prop added from CLI flags
					if (val.port) result.port = val.port;
					// @ts-expect-error revive attached prop added from CLI flags
					if (val.host) result.host = val.host;
					return result;
				} else {
					return val;
				}
			},
			// validate
			z
				.object({
					host: z
						.union([z.string(), z.boolean()])
						.optional()
						.default(ASTRO_CONFIG_DEFAULTS.server.host),
					port: z.number().optional().default(ASTRO_CONFIG_DEFAULTS.server.port),
					open: z.boolean().optional().default(ASTRO_CONFIG_DEFAULTS.server.open),
					headers: z.custom<OutgoingHttpHeaders>().optional(),
					streaming: z.boolean().optional().default(true),
				})
				.optional()
				.default({})
		),
	}).transform((config) => {
		// If the user changed outDir but not build.server, build.config, adjust so those
		// are relative to the outDir, as is the expected default.
		if (
			!config.build.server.toString().startsWith(config.outDir.toString()) &&
			config.build.server.toString().endsWith('dist/server/')
		) {
			config.build.server = new URL('./dist/server/', config.outDir);
		}
		if (
			!config.build.client.toString().startsWith(config.outDir.toString()) &&
			config.build.client.toString().endsWith('dist/client/')
		) {
			config.build.client = new URL('./dist/client/', config.outDir);
		}
		const trimmedBase = trimSlashes(config.base);

		// If there is no base but there is a base for site config, warn.
		const sitePathname = config.site && new URL(config.site).pathname;
		if (!trimmedBase.length && sitePathname && sitePathname !== '/') {
			config.base = sitePathname;
			/* eslint-disable no-console */
			console.warn(`The site configuration value includes a pathname of ${sitePathname} but there is no base configuration.

A future version of Astro will stop using the site pathname when producing <link> and <script> tags. Set your site's base with the base configuration.`);
		}

		if (trimmedBase.length && config.trailingSlash === 'never') {
			config.base = prependForwardSlash(trimmedBase);
		} else {
			config.base = prependForwardSlash(appendForwardSlash(trimmedBase));
		}

		return config;
	});

	return AstroConfigRelativeSchema;
}

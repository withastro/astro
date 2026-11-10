import * as z from 'zod/v4';
import { ROUTER_PLUGIN_DEFAULTS } from './defaults.js';
import type { RedirectConfig } from './types.js';
import type { ServerOutputOptions } from './internal/vite-plugin-server-output/index.js';

const RedirectStatusSchema = z.union([
	z.literal(300),
	z.literal(301),
	z.literal(302),
	z.literal(303),
	z.literal(304),
	z.literal(307),
	z.literal(308),
]);

/** Validates `RouterPluginOptions['build']`. */
export const RouterBuildOptionsSchema = z.object({
	format: z
		.union([z.literal('file'), z.literal('directory'), z.literal('preserve')])
		.optional()
		.default(ROUTER_PLUGIN_DEFAULTS.build.format),
	client: z.string().optional().default(ROUTER_PLUGIN_DEFAULTS.build.client),
	server: z.string().optional().default(ROUTER_PLUGIN_DEFAULTS.build.server),
	assets: z.string().optional().default(ROUTER_PLUGIN_DEFAULTS.build.assets),
	serverEntry: z.string().optional().default(ROUTER_PLUGIN_DEFAULTS.build.serverEntry),
	redirects: z.boolean().optional().default(ROUTER_PLUGIN_DEFAULTS.build.redirects),
	inlineStylesheets: z
		.enum(['always', 'auto', 'never'])
		.optional()
		.default(ROUTER_PLUGIN_DEFAULTS.build.inlineStylesheets),
	concurrency: z.number().min(1).optional().default(ROUTER_PLUGIN_DEFAULTS.build.concurrency),
});

/** Validates `RouterPluginOptions['security']`. */
export const RouterSecurityOptionsSchema = z.object({
	checkOrigin: z.boolean().default(ROUTER_PLUGIN_DEFAULTS.security.checkOrigin),
	allowedDomains: z
		.array(
			z.object({
				hostname: z.string().optional(),
				protocol: z.string().optional(),
				port: z.string().optional(),
			}),
		)
		.optional()
		.default([]),
	serverIslandBodySizeLimit: z
		.number()
		.optional()
		.default(ROUTER_PLUGIN_DEFAULTS.security.serverIslandBodySizeLimit),
});

/**
 * Validates `RouterPluginOptions` and applies defaults. The `astro` CLI config schema reuses the
 * field schemas through `.shape` of this schema, `RouterBuildOptionsSchema` and
 * `RouterSecurityOptionsSchema`.
 */
export const RouterPluginOptionsSchema = z.object({
	output: z
		.union([z.literal('static'), z.literal('server')])
		.optional()
		.default(ROUTER_PLUGIN_DEFAULTS.output),
	build: RouterBuildOptionsSchema.prefault({}),
	redirects: z
		.record(
			z.string(),
			z.union([z.string(), z.object({ status: RedirectStatusSchema, destination: z.string() })]),
		)
		.default(ROUTER_PLUGIN_DEFAULTS.redirects),
	security: RouterSecurityOptionsSchema.prefault({}),
	serverOutput: z
		.object({
			entrypoint: z.union([z.string(), z.instanceof(URL)]).optional(),
			internalFetchHeaders: z
				.union([
					z.record(z.string(), z.string()),
					z.custom<() => Record<string, string>>((value) => typeof value === 'function'),
				])
				.optional(),
		})
		.optional(),
});

/**
 * Options of `router()`.
 *
 * Shared options (`site`, `trailingSlash`, `compressHTML`) belong to `astro()` and are read from
 * `api.astro.config`; `root`, `base` and `publicDir` come from Vite, and so do the dev server
 * options (`server.host`, `server.port`, `server.headers`, …).
 */
export interface RouterPluginOptions {
	/**
	 * `'static'` prerenders every page unless it opts out with `export const prerender = false`.
	 * `'server'` renders on demand unless a page opts in with `export const prerender = true`.
	 *
	 * @default 'static'
	 */
	output?: 'static' | 'server';
	build?: {
		/**
		 * File name of each prerendered page: `'directory'` writes `/about/index.html`, `'file'`
		 * writes `/about.html`, `'preserve'` mirrors the source file name.
		 *
		 * @default 'directory'
		 */
		format?: 'file' | 'directory' | 'preserve';
		/**
		 * Output directory of client assets and prerendered pages for `output: 'server'`, relative to
		 * Vite's `build.outDir`.
		 *
		 * @default './client/'
		 */
		client?: string;
		/**
		 * Output directory of the server bundle for `output: 'server'`, relative to Vite's
		 * `build.outDir`.
		 *
		 * @default './server/'
		 */
		server?: string;
		/**
		 * Directory of generated assets inside the client output.
		 *
		 * @default '_astro'
		 */
		assets?: string;
		/**
		 * File name of the server entry inside the server output.
		 *
		 * @default 'entry.mjs'
		 */
		serverEntry?: string;
		/**
		 * Whether redirects are written as HTML files in static output.
		 *
		 * @default true
		 */
		redirects?: boolean;
		/**
		 * When page stylesheets are inlined in a `<style>` tag instead of linked.
		 *
		 * @default 'auto'
		 */
		inlineStylesheets?: 'always' | 'auto' | 'never';
		/**
		 * How many pages are prerendered in parallel.
		 *
		 * @default 1
		 */
		concurrency?: number;
	};
	/**
	 * Redirects from a route pattern to a destination path or URL.
	 *
	 * @default {}
	 */
	redirects?: Record<string, RedirectConfig>;
	security?: {
		/**
		 * Whether cross-site form submissions to on-demand pages are rejected.
		 *
		 * @default true
		 */
		checkOrigin?: boolean;
		/**
		 * Hosts trusted in `X-Forwarded-Host` and related headers.
		 *
		 * @default []
		 */
		allowedDomains?: Array<{ hostname?: string; protocol?: string; port?: string }>;
		/**
		 * Maximum size, in bytes, of a server island request body.
		 *
		 * @default 1048576
		 */
		serverIslandBodySizeLimit?: number;
	};
	/**
	 * The shape of the server output for `output: 'server'`: the module used as the server entry
	 * and the headers client code adds to its internal requests. Set by the platform plugin that
	 * deploys the output.
	 */
	serverOutput?: ServerOutputOptions;
}

/** `RouterPluginOptions` after validation, with defaults applied. */
export type ResolvedRouterPluginOptions = z.output<typeof RouterPluginOptionsSchema>;

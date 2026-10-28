import * as z from 'zod/v4';
import { ASTRO_PLUGIN_DEFAULTS } from './defaults.js';
import type { AstroRenderer, ClientDirectiveConfig } from '@astrojs/runtime/types';

const EntrypointSchema = z.union([z.string(), z.instanceof(URL)]);
const OptimizeDepsSchema = z.object({
	include: z.array(z.string()).optional(),
	exclude: z.array(z.string()).optional(),
});

/**
 * Validates `AstroPluginOptions` and applies defaults. The `astro` CLI config schema reuses the
 * field schemas through `AstroPluginOptionsSchema.shape`.
 */
export const AstroPluginOptionsSchema = z.object({
	root: z.string().optional(),
	srcDir: z.string().optional().default(ASTRO_PLUGIN_DEFAULTS.srcDir),
	publicDir: z.string().optional().default(ASTRO_PLUGIN_DEFAULTS.publicDir),
	site: z.string().url().optional(),
	compressHTML: z
		.union([z.boolean(), z.literal('jsx')])
		.optional()
		.default(ASTRO_PLUGIN_DEFAULTS.compressHTML),
	trailingSlash: z
		.union([z.literal('always'), z.literal('never'), z.literal('ignore')])
		.optional()
		.default(ASTRO_PLUGIN_DEFAULTS.trailingSlash),
	renderers: z
		.array(
			z.object({
				name: z.string(),
				// Renderers of integrations may set `null`.
				clientEntrypoint: EntrypointSchema.nullish(),
				serverEntrypoint: EntrypointSchema,
				options: z.unknown().optional(),
				optimizeDeps: z
					.object({ client: OptimizeDepsSchema.optional(), server: OptimizeDepsSchema.optional() })
					.optional(),
				dedupe: z.array(z.string()).optional(),
				noExternal: z.array(z.string()).optional(),
				devHeadScript: z.string().optional(),
			}),
		)
		.optional()
		.default([]),
	clientDirectives: z
		.array(z.object({ name: z.string(), entrypoint: EntrypointSchema }))
		.optional()
		.default([]),
});

/**
 * Options of `astro()`.
 *
 * The URL base is not an option: it is read from Vite's resolved `base`.
 */
export interface AstroPluginOptions {
	/**
	 * Project root, resolved against Vite's `root`.
	 *
	 * @default Vite's `root`
	 */
	root?: string;
	/**
	 * Directory of the project's source files, resolved against `root`.
	 *
	 * @default './src'
	 */
	srcDir?: string;
	/**
	 * Directory of static assets served as-is, resolved against `root`.
	 *
	 * @default './public'
	 */
	publicDir?: string;
	/**
	 * Final deployed URL of the site, including protocol and host. Must be an absolute URL.
	 */
	site?: string;
	/**
	 * Whether to minify the HTML output. `'jsx'` collapses whitespace using the same rules as JSX.
	 *
	 * @default 'jsx'
	 */
	compressHTML?: boolean | 'jsx';
	/**
	 * Trailing-slash policy for generated URLs, such as server island endpoints.
	 *
	 * @default 'ignore'
	 */
	trailingSlash?: 'always' | 'never' | 'ignore';
	/**
	 * Framework renderers (React, Vue, …) used to render and hydrate non-Astro components.
	 *
	 * @default []
	 */
	renderers?: AstroRenderer[];
	/**
	 * Custom `client:*` directives, in addition to the built-in ones.
	 *
	 * @default []
	 */
	clientDirectives?: ClientDirectiveConfig[];
}

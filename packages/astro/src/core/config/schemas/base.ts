import type { OutgoingHttpHeaders } from 'node:http';
import type {
	RehypePlugin as _RehypePlugin,
	RemarkPlugin as _RemarkPlugin,
	RemarkRehype as _RemarkRehype,
	ShikiConfig,
} from '@astrojs/markdown-remark';
import { markdownConfigDefaults, syntaxHighlightDefaults } from '@astrojs/markdown-remark';
import { type BuiltinTheme, bundledThemes } from 'shiki';
import { z } from 'zod';
import { localFontFamilySchema, remoteFontFamilySchema } from '../../../assets/fonts/config.js';
import { EnvSchema } from '../../../env/schema.js';
import type { AstroUserConfig, ViteUserConfig } from '../../../types/public/config.js';
import { allowedDirectivesSchema, cspAlgorithmSchema, cspHashSchema } from '../../csp/config.js';

// The below types are required boilerplate to workaround a Zod issue since v3.21.2. Since that version,
// Zod's compiled TypeScript would "simplify" certain values to their base representation, causing references
// to transitive dependencies that Astro don't depend on (e.g. `mdast-util-to-hast` or `remark-rehype`). For example:
//
// ```ts
// // input
// type Foo = { bar: string };
// export const value: Foo;
//
// // output
// export const value: { bar: string }; // <-- `Foo` is gone
// ```
//
// The types below will "complexify" the types so that TypeScript would not simplify them. This way it will
// reference the complex type directly, instead of referencing non-existent transitive dependencies.
//
// Also, make sure to not index the complexified type, as it would return a simplified value type, which goes
// back to the issue again. The complexified type should be the base representation that we want to expose.

/** @lintignore */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ComplexifyUnionObj {}

type ComplexifyWithUnion<T> = T & ComplexifyUnionObj;
type ComplexifyWithOmit<T> = Omit<T, '__nonExistent'>;

type ShikiLang = ComplexifyWithUnion<NonNullable<ShikiConfig['langs']>[number]>;
type ShikiTheme = ComplexifyWithUnion<NonNullable<ShikiConfig['theme']>>;
type ShikiTransformer = ComplexifyWithUnion<NonNullable<ShikiConfig['transformers']>[number]>;
type RehypePlugin = ComplexifyWithUnion<_RehypePlugin>;
type RemarkPlugin = ComplexifyWithUnion<_RemarkPlugin>;
/** @lintignore */
export type RemarkRehype = ComplexifyWithOmit<_RemarkRehype>;

export const ASTRO_CONFIG_DEFAULTS = {
	root: '.',
	srcDir: './src',
	publicDir: './public',
	outDir: './dist',
	cacheDir: './node_modules/.astro',
	base: '/',
	trailingSlash: 'ignore',
	build: {
		format: 'directory',
		client: './client/',
		server: './server/',
		assets: '_astro',
		serverEntry: 'entry.mjs',
		redirects: true,
		inlineStylesheets: 'auto',
		concurrency: 1,
	},
	image: {
		endpoint: { entrypoint: undefined, route: '/_image' },
		service: { entrypoint: 'astro/assets/services/sharp', config: {} },
		responsiveStyles: false,
	},
	devToolbar: {
		enabled: true,
	},
	compressHTML: true,
	server: {
		host: false,
		port: 4321,
		open: false,
		allowedHosts: [],
	},
	integrations: [],
	markdown: markdownConfigDefaults,
	vite: {},
	legacy: {
		collections: false,
	},
	redirects: {},
	security: {
		checkOrigin: true,
		allowedDomains: [],
	},
	env: {
		schema: {},
		validateSecrets: false,
	},
	session: undefined,
	experimental: {
		clientPrerender: false,
		contentIntellisense: false,
		headingIdCompat: false,
		preserveScriptOrder: false,
		liveContentCollections: false,
		csp: false,
		staticImportMetaEnv: false,
		chromeDevtoolsWorkspace: false,
		failOnPrerenderConflict: false,
	},
} satisfies AstroUserConfig & { server: { open: boolean } };

const highlighterTypesSchema = z
	.union([z.literal('shiki'), z.literal('prism')])
	.default(syntaxHighlightDefaults.type);

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
		.union([z.literal('static'), z.literal('server')])
		.optional()
		.default('static'),
	scopedStyleStrategy: z
		.union([z.literal('where'), z.literal('class'), z.literal('attribute')])
		.optional()
		.default('attribute'),
	adapter: z.object({ name: z.string(), hooks: z.object({}).passthrough().default({}) }).optional(),
	integrations: z.preprocess(
		// preprocess
		(val) => (Array.isArray(val) ? val.flat(Infinity).filter(Boolean) : val),
		// validate
		z
			.array(z.object({ name: z.string(), hooks: z.object({}).passthrough().default({}) }))
			.default(ASTRO_CONFIG_DEFAULTS.integrations),
	),
	build: z
		.object({
			format: z
				.union([z.literal('file'), z.literal('directory'), z.literal('preserve')])
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
			assetsPrefix: z
				.string()
				.optional()
				.or(z.object({ fallback: z.string() }).and(z.record(z.string())).optional()),
			serverEntry: z.string().optional().default(ASTRO_CONFIG_DEFAULTS.build.serverEntry),
			redirects: z.boolean().optional().default(ASTRO_CONFIG_DEFAULTS.build.redirects),
			inlineStylesheets: z
				.enum(['always', 'auto', 'never'])
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.build.inlineStylesheets),
			concurrency: z.number().min(1).optional().default(ASTRO_CONFIG_DEFAULTS.build.concurrency),
		})
		.default({}),
	server: z.preprocess(
		// preprocess
		// NOTE: Uses the "error" command here because this is overwritten by the
		// individualized schema parser with the correct command.
		(val) => (typeof val === 'function' ? val({ command: 'error' }) : val),
		// validate
		z
			.object({
				open: z
					.union([z.string(), z.boolean()])
					.optional()
					.default(ASTRO_CONFIG_DEFAULTS.server.open),
				host: z
					.union([z.string(), z.boolean()])
					.optional()
					.default(ASTRO_CONFIG_DEFAULTS.server.host),
				port: z.number().optional().default(ASTRO_CONFIG_DEFAULTS.server.port),
				headers: z.custom<OutgoingHttpHeaders>().optional(),
				allowedHosts: z
					.union([z.array(z.string()), z.literal(true)])
					.optional()
					.default(ASTRO_CONFIG_DEFAULTS.server.allowedHosts),
			})
			.default({}),
	),
	redirects: z
		.record(
			z.string(),
			z.union([
				z.string(),
				z.object({
					status: z.union([
						z.literal(300),
						z.literal(301),
						z.literal(302),
						z.literal(303),
						z.literal(304),
						z.literal(307),
						z.literal(308),
					]),
					destination: z.string(),
				}),
			]),
		)
		.default(ASTRO_CONFIG_DEFAULTS.redirects),
	prefetch: z
		.union([
			z.boolean(),
			z.object({
				prefetchAll: z.boolean().optional(),
				defaultStrategy: z.enum(['tap', 'hover', 'viewport', 'load']).optional(),
			}),
		])
		.optional(),
	image: z
		.object({
			endpoint: z
				.object({
					route: z
						.literal('/_image')
						.or(z.string())
						.default(ASTRO_CONFIG_DEFAULTS.image.endpoint.route),
					entrypoint: z.string().optional(),
				})
				.default(ASTRO_CONFIG_DEFAULTS.image.endpoint),
			service: z
				.object({
					entrypoint: z
						.union([z.literal('astro/assets/services/sharp'), z.string()])
						.default(ASTRO_CONFIG_DEFAULTS.image.service.entrypoint),
					config: z.record(z.any()).default({}),
				})
				.default(ASTRO_CONFIG_DEFAULTS.image.service),
			domains: z.array(z.string()).default([]),
			remotePatterns: z
				.array(
					z.object({
						protocol: z.string().optional(),
						hostname: z.string().optional(),
						port: z.string().optional(),
						pathname: z.string().optional(),
					}),
				)
				.default([]),
			layout: z.enum(['constrained', 'fixed', 'full-width', 'none']).optional(),
			objectFit: z.string().optional(),
			objectPosition: z.string().optional(),
			breakpoints: z.array(z.number()).optional(),
			responsiveStyles: z.boolean().default(ASTRO_CONFIG_DEFAULTS.image.responsiveStyles),
		})
		.default(ASTRO_CONFIG_DEFAULTS.image),
	devToolbar: z
		.object({
			enabled: z.boolean().default(ASTRO_CONFIG_DEFAULTS.devToolbar.enabled),
		})
		.default(ASTRO_CONFIG_DEFAULTS.devToolbar),
	markdown: z
		.object({
			syntaxHighlight: z
				.union([
					z
						.object({
							type: highlighterTypesSchema,
							excludeLangs: z
								.array(z.string())
								.optional()
								.default(syntaxHighlightDefaults.excludeLangs),
						})
						.default(syntaxHighlightDefaults),
					highlighterTypesSchema,
					z.literal(false),
				])
				.default(ASTRO_CONFIG_DEFAULTS.markdown.syntaxHighlight),
			shikiConfig: z
				.object({
					langs: z
						.custom<ShikiLang>()
						.array()
						.transform((langs) => {
							for (const lang of langs) {
								// shiki 1.0 compat
								if (typeof lang === 'object') {
									// `id` renamed to `name` (always override)
									if ((lang as any).id) {
										lang.name = (lang as any).id;
									}
									// `grammar` flattened to lang itself
									if ((lang as any).grammar) {
										Object.assign(lang, (lang as any).grammar);
									}
								}
							}
							return langs;
						})
						.default([]),
					langAlias: z
						.record(z.string(), z.string())
						.optional()
						.default(ASTRO_CONFIG_DEFAULTS.markdown.shikiConfig.langAlias!),
					theme: z
						.enum(Object.keys(bundledThemes) as [BuiltinTheme, ...BuiltinTheme[]])
						.or(z.custom<ShikiTheme>())
						.default(ASTRO_CONFIG_DEFAULTS.markdown.shikiConfig.theme!),
					themes: z
						.record(
							z
								.enum(Object.keys(bundledThemes) as [BuiltinTheme, ...BuiltinTheme[]])
								.or(z.custom<ShikiTheme>()),
						)
						.default(ASTRO_CONFIG_DEFAULTS.markdown.shikiConfig.themes!),
					defaultColor: z
						.union([z.literal('light'), z.literal('dark'), z.string(), z.literal(false)])
						.optional(),
					wrap: z.boolean().or(z.null()).default(ASTRO_CONFIG_DEFAULTS.markdown.shikiConfig.wrap!),
					transformers: z
						.custom<ShikiTransformer>()
						.array()
						.default(ASTRO_CONFIG_DEFAULTS.markdown.shikiConfig.transformers!),
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
				.default(ASTRO_CONFIG_DEFAULTS.markdown.remarkRehype),
			gfm: z.boolean().default(ASTRO_CONFIG_DEFAULTS.markdown.gfm),
			smartypants: z.boolean().default(ASTRO_CONFIG_DEFAULTS.markdown.smartypants),
		})
		.default({}),
	vite: z
		.custom<ViteUserConfig>((data) => data instanceof Object && !Array.isArray(data))
		.default(ASTRO_CONFIG_DEFAULTS.vite),
	i18n: z.optional(
		z
			.object({
				defaultLocale: z.string(),
				locales: z.array(
					z.union([
						z.string(),
						z.object({
							path: z.string(),
							codes: z.string().array().nonempty(),
						}),
					]),
				),
				domains: z
					.record(
						z.string(),
						z
							.string()
							.url(
								"The domain value must be a valid URL, and it has to start with 'https' or 'http'.",
							),
					)
					.optional(),
				fallback: z.record(z.string(), z.string()).optional(),
				routing: z
					.literal('manual')
					.or(
						z.object({
							prefixDefaultLocale: z.boolean().optional().default(false),
							// TODO: Astro 6.0 change to false
							redirectToDefaultLocale: z.boolean().optional().default(true),
							fallbackType: z.enum(['redirect', 'rewrite']).optional().default('redirect'),
						}),
					)
					.optional()
					.default({}),
			})
			.optional(),
	),
	security: z
		.object({
			checkOrigin: z.boolean().default(ASTRO_CONFIG_DEFAULTS.security.checkOrigin),
			allowedDomains: z
				.array(
					z.object({
						hostname: z.string().optional(),
						protocol: z.string().optional(),
						port: z.string().optional(),
					}),
				)
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.security.allowedDomains),
		})
		.optional()
		.default(ASTRO_CONFIG_DEFAULTS.security),
	env: z
		.object({
			schema: EnvSchema.optional().default(ASTRO_CONFIG_DEFAULTS.env.schema),
			validateSecrets: z.boolean().optional().default(ASTRO_CONFIG_DEFAULTS.env.validateSecrets),
		})
		.strict()
		.optional()
		.default(ASTRO_CONFIG_DEFAULTS.env),
	session: z
		.object({
			driver: z.string().optional(),
			options: z.record(z.any()).optional(),
			cookie: z
				.object({
					name: z.string().optional(),
					domain: z.string().optional(),
					path: z.string().optional(),
					maxAge: z.number().optional(),
					sameSite: z.union([z.enum(['strict', 'lax', 'none']), z.boolean()]).optional(),
					secure: z.boolean().optional(),
				})
				.or(z.string())
				.transform((val) => {
					if (typeof val === 'string') {
						return { name: val };
					}
					return val;
				})
				.optional(),
			ttl: z.number().optional(),
		})
		.optional(),
	experimental: z
		.object({
			clientPrerender: z
				.boolean()
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.experimental.clientPrerender),
			contentIntellisense: z
				.boolean()
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.experimental.contentIntellisense),
			headingIdCompat: z
				.boolean()
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.experimental.headingIdCompat),
			preserveScriptOrder: z
				.boolean()
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.experimental.preserveScriptOrder),
			fonts: z.array(z.union([localFontFamilySchema, remoteFontFamilySchema])).optional(),
			liveContentCollections: z
				.boolean()
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.experimental.liveContentCollections),
			csp: z
				.union([
					z.boolean().optional().default(ASTRO_CONFIG_DEFAULTS.experimental.csp),
					z.object({
						algorithm: cspAlgorithmSchema,
						directives: z.array(allowedDirectivesSchema).optional(),
						styleDirective: z
							.object({
								resources: z.array(z.string()).optional(),
								hashes: z.array(cspHashSchema).optional(),
							})
							.optional(),
						scriptDirective: z
							.object({
								resources: z.array(z.string()).optional(),
								hashes: z.array(cspHashSchema).optional(),
								strictDynamic: z.boolean().optional(),
							})
							.optional(),
					}),
				])
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.experimental.csp),
			staticImportMetaEnv: z
				.boolean()
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.experimental.staticImportMetaEnv),
			chromeDevtoolsWorkspace: z
				.boolean()
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.experimental.chromeDevtoolsWorkspace),
			failOnPrerenderConflict: z
				.boolean()
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.experimental.failOnPrerenderConflict),
		})
		.strict(
			`Invalid or outdated experimental feature.\nCheck for incorrect spelling or outdated Astro version.\nSee https://docs.astro.build/en/reference/experimental-flags/ for a list of all current experiments.`,
		)
		.default({}),
	legacy: z
		.object({
			collections: z.boolean().optional().default(ASTRO_CONFIG_DEFAULTS.legacy.collections),
		})
		.default({}),
});

export type AstroConfigType = z.infer<typeof AstroConfigSchema>;

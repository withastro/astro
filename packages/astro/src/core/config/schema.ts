import type {
	ShikiConfig,
	RehypePlugin as _RehypePlugin,
	RemarkPlugin as _RemarkPlugin,
	RemarkRehype as _RemarkRehype,
} from '@astrojs/markdown-remark';
import { markdownConfigDefaults } from '@astrojs/markdown-remark';
import { type BuiltinTheme, bundledThemes } from 'shiki';
import type { AstroUserConfig, ViteUserConfig } from '../../@types/astro.js';

import type { OutgoingHttpHeaders } from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { EnvSchema } from '../../env/schema.js';
import { appendForwardSlash, prependForwardSlash, removeTrailingForwardSlash } from '../path.js';

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

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ComplexifyUnionObj {}

type ComplexifyWithUnion<T> = T & ComplexifyUnionObj;
type ComplexifyWithOmit<T> = Omit<T, '__nonExistent'>;

type ShikiLang = ComplexifyWithUnion<NonNullable<ShikiConfig['langs']>[number]>;
type ShikiTheme = ComplexifyWithUnion<NonNullable<ShikiConfig['theme']>>;
type ShikiTransformer = ComplexifyWithUnion<NonNullable<ShikiConfig['transformers']>[number]>;
type RehypePlugin = ComplexifyWithUnion<_RehypePlugin>;
type RemarkPlugin = ComplexifyWithUnion<_RemarkPlugin>;
type RemarkRehype = ComplexifyWithOmit<_RemarkRehype>;

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
		client: './dist/client/',
		server: './dist/server/',
		assets: '_astro',
		serverEntry: 'entry.mjs',
		redirects: true,
		inlineStylesheets: 'auto',
		concurrency: 1,
	},
	image: {
		service: { entrypoint: 'astro/assets/services/sharp', config: {} },
	},
	devToolbar: {
		enabled: true,
	},
	compressHTML: true,
	server: {
		host: false,
		port: 4321,
		open: false,
	},
	integrations: [],
	markdown: markdownConfigDefaults,
	vite: {},
	legacy: {},
	redirects: {},
	security: {},
	experimental: {
		directRenderScript: false,
		contentCollectionCache: false,
		clientPrerender: false,
		globalRoutePriority: false,
		serverIslands: false,
		contentIntellisense: false,
		env: {
			validateSecrets: false,
		},
		contentLayer: false,
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
				.or(z.object({ fallback: z.string() }).and(z.record(z.string())).optional())
				.refine(
					(value) => {
						if (value && typeof value !== 'string') {
							if (!value.fallback) {
								return false;
							}
						}
						return true;
					},
					{
						message: 'The `fallback` is mandatory when defining the option as an object.',
					},
				),
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
			endpoint: z.string().optional(),
			service: z
				.object({
					entrypoint: z
						.union([
							z.literal('astro/assets/services/sharp'),
							z.literal('astro/assets/services/squoosh'),
							z.string(),
						])
						.default(ASTRO_CONFIG_DEFAULTS.image.service.entrypoint),
					config: z.record(z.any()).default({}),
				})
				.default(ASTRO_CONFIG_DEFAULTS.image.service),
			domains: z.array(z.string()).default([]),
			remotePatterns: z
				.array(
					z.object({
						protocol: z.string().optional(),
						hostname: z
							.string()
							.refine(
								(val) => !val.includes('*') || val.startsWith('*.') || val.startsWith('**.'),
								{
									message: 'wildcards can only be placed at the beginning of the hostname',
								},
							)
							.optional(),
						port: z.string().optional(),
						pathname: z
							.string()
							.refine((val) => !val.includes('*') || val.endsWith('/*') || val.endsWith('/**'), {
								message: 'wildcards can only be placed at the end of a pathname',
							})
							.optional(),
					}),
				)
				.default([]),
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
				.union([z.literal('shiki'), z.literal('prism'), z.literal(false)])
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
						.transform((transformers) => {
							for (const transformer of transformers) {
								// When updating shikiji to shiki, the `token` property was renamed to `span`.
								// We apply the compat here for now until the next Astro major.
								// TODO: Remove this in Astro 5.0
								if ((transformer as any).token && !('span' in transformer)) {
									transformer.span = (transformer as any).token;
								}
							}
							return transformers;
						})
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
						z
							.object({
								prefixDefaultLocale: z.boolean().optional().default(false),
								redirectToDefaultLocale: z.boolean().optional().default(true),
								fallbackType: z.enum(['redirect', 'rewrite']).optional().default('redirect'),
							})
							.refine(
								({ prefixDefaultLocale, redirectToDefaultLocale }) => {
									return !(prefixDefaultLocale === false && redirectToDefaultLocale === false);
								},
								{
									message:
										'The option `i18n.redirectToDefaultLocale` is only useful when the `i18n.prefixDefaultLocale` is set to `true`. Remove the option `i18n.redirectToDefaultLocale`, or change its value to `true`.',
								},
							),
					)
					.optional()
					.default({}),
			})
			.optional()
			.superRefine((i18n, ctx) => {
				if (i18n) {
					const { defaultLocale, locales: _locales, fallback, domains } = i18n;
					const locales = _locales.map((locale) => {
						if (typeof locale === 'string') {
							return locale;
						} else {
							return locale.path;
						}
					});
					if (!locales.includes(defaultLocale)) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: `The default locale \`${defaultLocale}\` is not present in the \`i18n.locales\` array.`,
						});
					}
					if (fallback) {
						for (const [fallbackFrom, fallbackTo] of Object.entries(fallback)) {
							if (!locales.includes(fallbackFrom)) {
								ctx.addIssue({
									code: z.ZodIssueCode.custom,
									message: `The locale \`${fallbackFrom}\` key in the \`i18n.fallback\` record doesn't exist in the \`i18n.locales\` array.`,
								});
							}

							if (fallbackFrom === defaultLocale) {
								ctx.addIssue({
									code: z.ZodIssueCode.custom,
									message: `You can't use the default locale as a key. The default locale can only be used as value.`,
								});
							}

							if (!locales.includes(fallbackTo)) {
								ctx.addIssue({
									code: z.ZodIssueCode.custom,
									message: `The locale \`${fallbackTo}\` value in the \`i18n.fallback\` record doesn't exist in the \`i18n.locales\` array.`,
								});
							}
						}
					}
					if (domains) {
						const entries = Object.entries(domains);
						const hasDomains = domains ? Object.keys(domains).length > 0 : false;
						if (entries.length > 0 && !hasDomains) {
							ctx.addIssue({
								code: z.ZodIssueCode.custom,
								message: `When specifying some domains, the property \`i18n.routingStrategy\` must be set to \`"domains"\`.`,
							});
						}

						for (const [domainKey, domainValue] of entries) {
							if (!locales.includes(domainKey)) {
								ctx.addIssue({
									code: z.ZodIssueCode.custom,
									message: `The locale \`${domainKey}\` key in the \`i18n.domains\` record doesn't exist in the \`i18n.locales\` array.`,
								});
							}
							if (!domainValue.startsWith('https') && !domainValue.startsWith('http')) {
								ctx.addIssue({
									code: z.ZodIssueCode.custom,
									message:
										"The domain value must be a valid URL, and it has to start with 'https' or 'http'.",
									path: ['domains'],
								});
							} else {
								try {
									const domainUrl = new URL(domainValue);
									if (domainUrl.pathname !== '/') {
										ctx.addIssue({
											code: z.ZodIssueCode.custom,
											message: `The URL \`${domainValue}\` must contain only the origin. A subsequent pathname isn't allowed here. Remove \`${domainUrl.pathname}\`.`,
											path: ['domains'],
										});
									}
								} catch {
									// no need to catch the error
								}
							}
						}
					}
				}
			}),
	),
	security: z
		.object({
			checkOrigin: z.boolean().default(false),
		})
		.optional()
		.default(ASTRO_CONFIG_DEFAULTS.security),
	experimental: z
		.object({
			directRenderScript: z
				.boolean()
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.experimental.directRenderScript),
			contentCollectionCache: z
				.boolean()
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.experimental.contentCollectionCache),
			clientPrerender: z
				.boolean()
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.experimental.clientPrerender),
			globalRoutePriority: z
				.boolean()
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.experimental.globalRoutePriority),
			env: z
				.object({
					schema: EnvSchema.optional(),
					validateSecrets: z
						.boolean()
						.optional()
						.default(ASTRO_CONFIG_DEFAULTS.experimental.env.validateSecrets),
				})
				.strict()
				.optional(),
			serverIslands: z
				.boolean()
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.experimental.serverIslands),
			contentIntellisense: z
				.boolean()
				.optional()
				.default(ASTRO_CONFIG_DEFAULTS.experimental.contentIntellisense),
			contentLayer: z.boolean().optional().default(ASTRO_CONFIG_DEFAULTS.experimental.contentLayer),
		})
		.strict(
			`Invalid or outdated experimental feature.\nCheck for incorrect spelling or outdated Astro version.\nSee https://docs.astro.build/en/reference/configuration-reference/#experimental-flags for a list of all current experiments.`,
		)
		.default({}),
	legacy: z.object({}).default({}),
});

export type AstroConfigType = z.infer<typeof AstroConfigSchema>;

export function createRelativeSchema(cmd: string, fileProtocolRoot: string) {
	// We need to extend the global schema to add transforms that are relative to root.
	// This is type checked against the global schema to make sure we still match.
	const AstroConfigRelativeSchema = AstroConfigSchema.extend({
		root: z
			.string()
			.default(ASTRO_CONFIG_DEFAULTS.root)
			.transform((val) => resolveDirAsUrl(val, fileProtocolRoot)),
		srcDir: z
			.string()
			.default(ASTRO_CONFIG_DEFAULTS.srcDir)
			.transform((val) => resolveDirAsUrl(val, fileProtocolRoot)),
		compressHTML: z.boolean().optional().default(ASTRO_CONFIG_DEFAULTS.compressHTML),
		publicDir: z
			.string()
			.default(ASTRO_CONFIG_DEFAULTS.publicDir)
			.transform((val) => resolveDirAsUrl(val, fileProtocolRoot)),
		outDir: z
			.string()
			.default(ASTRO_CONFIG_DEFAULTS.outDir)
			.transform((val) => resolveDirAsUrl(val, fileProtocolRoot)),
		cacheDir: z
			.string()
			.default(ASTRO_CONFIG_DEFAULTS.cacheDir)
			.transform((val) => resolveDirAsUrl(val, fileProtocolRoot)),
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
					.transform((val) => resolveDirAsUrl(val, fileProtocolRoot)),
				server: z
					.string()
					.optional()
					.default(ASTRO_CONFIG_DEFAULTS.build.server)
					.transform((val) => resolveDirAsUrl(val, fileProtocolRoot)),
				assets: z.string().optional().default(ASTRO_CONFIG_DEFAULTS.build.assets),
				assetsPrefix: z
					.string()
					.optional()
					.or(z.object({ fallback: z.string() }).and(z.record(z.string())).optional())
					.refine(
						(value) => {
							if (value && typeof value !== 'string') {
								if (!value.fallback) {
									return false;
								}
							}
							return true;
						},
						{
							message: 'The `fallback` is mandatory when defining the option as an object.',
						},
					),
				serverEntry: z.string().optional().default(ASTRO_CONFIG_DEFAULTS.build.serverEntry),
				redirects: z.boolean().optional().default(ASTRO_CONFIG_DEFAULTS.build.redirects),
				inlineStylesheets: z
					.enum(['always', 'auto', 'never'])
					.optional()
					.default(ASTRO_CONFIG_DEFAULTS.build.inlineStylesheets),
				concurrency: z.number().min(1).optional().default(ASTRO_CONFIG_DEFAULTS.build.concurrency),
			})
			.optional()
			.default({}),
		server: z.preprocess(
			// preprocess
			(val) => {
				if (typeof val === 'function') {
					return val({ command: cmd === 'dev' ? 'dev' : 'preview' });
				} else {
					return val;
				}
			},
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
					streaming: z.boolean().optional().default(true),
				})
				.optional()
				.default({}),
		),
	})
		.transform((config) => {
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

			// Handle `base` trailing slash based on `trailingSlash` config
			if (config.trailingSlash === 'never') {
				config.base = prependForwardSlash(removeTrailingForwardSlash(config.base));
			} else if (config.trailingSlash === 'always') {
				config.base = prependForwardSlash(appendForwardSlash(config.base));
			} else {
				config.base = prependForwardSlash(config.base);
			}

			return config;
		})
		.refine((obj) => !obj.outDir.toString().startsWith(obj.publicDir.toString()), {
			message:
				'The value of `outDir` must not point to a path within the folder set as `publicDir`, this will cause an infinite loop',
		})
		.superRefine((configuration, ctx) => {
			const { site, i18n, output } = configuration;
			const hasDomains = i18n?.domains ? Object.keys(i18n.domains).length > 0 : false;
			if (hasDomains) {
				if (!site) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message:
							"The option `site` isn't set. When using the 'domains' strategy for `i18n`, `site` is required to create absolute URLs for locales that aren't mapped to a domain.",
					});
				}
				if (output !== 'server') {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Domain support is only available when `output` is `"server"`.',
					});
				}
			}
		});

	return AstroConfigRelativeSchema;
}

function resolveDirAsUrl(dir: string, root: string) {
	let resolvedDir = path.resolve(root, dir);
	if (!resolvedDir.endsWith(path.sep)) {
		resolvedDir += path.sep;
	}
	return pathToFileURL(resolvedDir);
}

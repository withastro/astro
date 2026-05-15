import type {
	RehypePlugin as _RehypePlugin,
	RemarkPlugin as _RemarkPlugin,
	RemarkRehype as _RemarkRehype,
	Smartypants as _Smartypants,
	ShikiConfig,
} from '@astrojs/markdown-remark';
import type { OutgoingHttpHeaders } from 'node:http';
import * as z from 'zod/v4';
import type { ViteUserConfig } from '../../../types/public/config.js';
/** @lintignore */
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
/** @lintignore */
export type Smartypants = ComplexifyWithOmit<_Smartypants>;
export declare const ASTRO_CONFIG_DEFAULTS: {
	root: string;
	srcDir: string;
	publicDir: string;
	outDir: string;
	cacheDir: string;
	base: string;
	trailingSlash: 'ignore';
	build: {
		format: 'directory';
		client: string;
		server: string;
		assets: string;
		serverEntry: string;
		redirects: true;
		inlineStylesheets: 'auto';
		concurrency: number;
	};
	image: {
		endpoint: {
			entrypoint: undefined;
			route: '/_image';
		};
		service: {
			entrypoint: 'astro/assets/services/sharp';
			config: {};
		};
		dangerouslyProcessSVG: false;
		responsiveStyles: false;
	};
	devToolbar: {
		enabled: true;
	};
	compressHTML: true;
	server: {
		host: false;
		port: number;
		open: false;
		allowedHosts: never[];
	};
	integrations: never[];
	markdown: Required<import('@astrojs/markdown-remark').AstroMarkdownOptions>;
	vite: {};
	legacy: {
		collectionsBackwardsCompat: false;
	};
	redirects: {};
	security: {
		checkOrigin: true;
		allowedDomains: never[];
		csp: false;
		actionBodySizeLimit: number;
		serverIslandBodySizeLimit: number;
	};
	env: {
		schema: {};
		validateSecrets: false;
	};
	prerenderConflictBehavior: 'warn';
	experimental: {
		advancedRouting: false;
		clientPrerender: false;
		contentIntellisense: false;
		chromeDevtoolsWorkspace: false;
		rustCompiler: false;
		queuedRendering: {
			enabled: false;
		};
		logger: {
			entrypoint: string;
		};
	};
};
export declare const AstroConfigSchema: z.ZodObject<
	{
		root: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<URL, string>>;
		srcDir: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<URL, string>>;
		publicDir: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<URL, string>>;
		outDir: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<URL, string>>;
		cacheDir: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<URL, string>>;
		site: z.ZodOptional<z.ZodString>;
		compressHTML: z.ZodDefault<
			z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodLiteral<'jsx'>]>>
		>;
		base: z.ZodDefault<z.ZodOptional<z.ZodString>>;
		trailingSlash: z.ZodDefault<
			z.ZodOptional<
				z.ZodUnion<readonly [z.ZodLiteral<'always'>, z.ZodLiteral<'never'>, z.ZodLiteral<'ignore'>]>
			>
		>;
		output: z.ZodDefault<
			z.ZodOptional<
				z.ZodUnion<
					readonly [z.ZodLiteral<'static'>, z.ZodLiteral<'server'>, z.ZodLiteral<'hybrid'>]
				>
			>
		> &
			z.ZodType<
				'server' | 'static',
				'server' | 'static' | 'hybrid' | undefined,
				z.core.$ZodTypeInternals<'server' | 'static', 'server' | 'static' | 'hybrid' | undefined>
			>;
		scopedStyleStrategy: z.ZodDefault<
			z.ZodOptional<
				z.ZodUnion<
					readonly [z.ZodLiteral<'where'>, z.ZodLiteral<'class'>, z.ZodLiteral<'attribute'>]
				>
			>
		>;
		adapter: z.ZodOptional<
			z.ZodObject<
				{
					name: z.ZodString;
					hooks: z.ZodDefault<z.ZodObject<{}, z.core.$loose>>;
				},
				z.core.$strip
			>
		>;
		integrations: z.ZodDefault<
			z.ZodOptional<
				z.ZodPipe<
					z.ZodTransform<unknown, unknown>,
					z.ZodArray<
						z.ZodObject<
							{
								name: z.ZodString;
								hooks: z.ZodDefault<z.ZodObject<{}, z.core.$loose>>;
							},
							z.core.$strip
						>
					>
				>
			>
		>;
		build: z.ZodPrefault<
			z.ZodObject<
				{
					format: z.ZodDefault<
						z.ZodOptional<
							z.ZodUnion<
								readonly [z.ZodLiteral<'file'>, z.ZodLiteral<'directory'>, z.ZodLiteral<'preserve'>]
							>
						>
					>;
					client: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<URL, string>>;
					server: z.ZodPipe<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodTransform<URL, string>>;
					assets: z.ZodDefault<z.ZodOptional<z.ZodString>>;
					assetsPrefix: z.ZodOptional<
						z.ZodUnion<
							[
								z.ZodOptional<z.ZodString>,
								z.ZodIntersection<
									z.ZodObject<
										{
											fallback: z.ZodString;
										},
										z.core.$strip
									>,
									z.ZodRecord<z.ZodString, z.ZodString>
								>,
							]
						>
					>;
					serverEntry: z.ZodDefault<z.ZodOptional<z.ZodString>>;
					redirects: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
					inlineStylesheets: z.ZodDefault<
						z.ZodOptional<
							z.ZodEnum<{
								never: 'never';
								auto: 'auto';
								always: 'always';
							}>
						>
					>;
					concurrency: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
				},
				z.core.$strip
			>
		>;
		server: z.ZodPrefault<
			z.ZodPipe<
				z.ZodTransform<any, unknown>,
				z.ZodObject<
					{
						open: z.ZodDefault<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodBoolean]>>>;
						host: z.ZodDefault<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodBoolean]>>>;
						port: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
						headers: z.ZodOptional<z.ZodCustom<OutgoingHttpHeaders, OutgoingHttpHeaders>>;
						allowedHosts: z.ZodDefault<
							z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodLiteral<true>]>>
						>;
					},
					z.core.$strip
				>
			>
		>;
		redirects: z.ZodDefault<
			z.ZodRecord<
				z.ZodString,
				z.ZodUnion<
					readonly [
						z.ZodString,
						z.ZodObject<
							{
								status: z.ZodUnion<
									readonly [
										z.ZodLiteral<300>,
										z.ZodLiteral<301>,
										z.ZodLiteral<302>,
										z.ZodLiteral<303>,
										z.ZodLiteral<304>,
										z.ZodLiteral<307>,
										z.ZodLiteral<308>,
									]
								>;
								destination: z.ZodString;
							},
							z.core.$strip
						>,
					]
				>
			>
		>;
		prefetch: z.ZodOptional<
			z.ZodUnion<
				readonly [
					z.ZodBoolean,
					z.ZodObject<
						{
							prefetchAll: z.ZodOptional<z.ZodBoolean>;
							defaultStrategy: z.ZodOptional<
								z.ZodEnum<{
									load: 'load';
									tap: 'tap';
									hover: 'hover';
									viewport: 'viewport';
								}>
							>;
						},
						z.core.$strip
					>,
				]
			>
		>;
		image: z.ZodPrefault<
			z.ZodObject<
				{
					endpoint: z.ZodDefault<
						z.ZodObject<
							{
								route: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<'/_image'>, z.ZodString]>>;
								entrypoint: z.ZodOptional<z.ZodString>;
							},
							z.core.$strip
						>
					>;
					service: z.ZodDefault<
						z.ZodObject<
							{
								entrypoint: z.ZodDefault<
									z.ZodUnion<readonly [z.ZodLiteral<'astro/assets/services/sharp'>, z.ZodString]>
								>;
								config: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
							},
							z.core.$strip
						>
					>;
					dangerouslyProcessSVG: z.ZodDefault<z.ZodBoolean>;
					domains: z.ZodDefault<z.ZodArray<z.ZodString>>;
					remotePatterns: z.ZodDefault<
						z.ZodArray<
							z.ZodObject<
								{
									protocol: z.ZodOptional<z.ZodString>;
									hostname: z.ZodOptional<z.ZodString>;
									port: z.ZodOptional<z.ZodString>;
									pathname: z.ZodOptional<z.ZodString>;
								},
								z.core.$strip
							>
						>
					>;
					layout: z.ZodOptional<
						z.ZodEnum<{
							fixed: 'fixed';
							none: 'none';
							constrained: 'constrained';
							'full-width': 'full-width';
						}>
					>;
					objectFit: z.ZodOptional<z.ZodString>;
					objectPosition: z.ZodOptional<z.ZodString>;
					breakpoints: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
					responsiveStyles: z.ZodDefault<z.ZodBoolean>;
				},
				z.core.$strip
			>
		>;
		devToolbar: z.ZodDefault<
			z.ZodObject<
				{
					enabled: z.ZodDefault<z.ZodBoolean>;
					placement: z.ZodOptional<
						z.ZodEnum<{
							'bottom-left': 'bottom-left';
							'bottom-center': 'bottom-center';
							'bottom-right': 'bottom-right';
						}>
					>;
				},
				z.core.$strip
			>
		>;
		markdown: z.ZodPrefault<
			z.ZodObject<
				{
					syntaxHighlight: z.ZodDefault<
						z.ZodUnion<
							readonly [
								z.ZodDefault<
									z.ZodObject<
										{
											type: z.ZodDefault<
												z.ZodUnion<readonly [z.ZodLiteral<'shiki'>, z.ZodLiteral<'prism'>]>
											>;
											excludeLangs: z.ZodOptional<z.ZodArray<z.ZodString>>;
										},
										z.core.$strip
									>
								>,
								z.ZodDefault<z.ZodUnion<readonly [z.ZodLiteral<'shiki'>, z.ZodLiteral<'prism'>]>>,
								z.ZodLiteral<false>,
							]
						>
					>;
					shikiConfig: z.ZodPrefault<
						z.ZodObject<
							{
								langs: z.ZodDefault<
									z.ZodPipe<
										z.ZodArray<z.ZodCustom<ShikiLang, ShikiLang>>,
										z.ZodTransform<ShikiLang[], ShikiLang[]>
									>
								>;
								langAlias: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>>;
								theme: z.ZodDefault<
									z.ZodUnion<
										[
											z.ZodEnum<{
												andromeeda: 'andromeeda';
												'aurora-x': 'aurora-x';
												'ayu-dark': 'ayu-dark';
												'ayu-light': 'ayu-light';
												'ayu-mirage': 'ayu-mirage';
												'catppuccin-frappe': 'catppuccin-frappe';
												'catppuccin-latte': 'catppuccin-latte';
												'catppuccin-macchiato': 'catppuccin-macchiato';
												'catppuccin-mocha': 'catppuccin-mocha';
												'dark-plus': 'dark-plus';
												dracula: 'dracula';
												'dracula-soft': 'dracula-soft';
												'everforest-dark': 'everforest-dark';
												'everforest-light': 'everforest-light';
												'github-dark': 'github-dark';
												'github-dark-default': 'github-dark-default';
												'github-dark-dimmed': 'github-dark-dimmed';
												'github-dark-high-contrast': 'github-dark-high-contrast';
												'github-light': 'github-light';
												'github-light-default': 'github-light-default';
												'github-light-high-contrast': 'github-light-high-contrast';
												'gruvbox-dark-hard': 'gruvbox-dark-hard';
												'gruvbox-dark-medium': 'gruvbox-dark-medium';
												'gruvbox-dark-soft': 'gruvbox-dark-soft';
												'gruvbox-light-hard': 'gruvbox-light-hard';
												'gruvbox-light-medium': 'gruvbox-light-medium';
												'gruvbox-light-soft': 'gruvbox-light-soft';
												horizon: 'horizon';
												'horizon-bright': 'horizon-bright';
												houston: 'houston';
												'kanagawa-dragon': 'kanagawa-dragon';
												'kanagawa-lotus': 'kanagawa-lotus';
												'kanagawa-wave': 'kanagawa-wave';
												laserwave: 'laserwave';
												'light-plus': 'light-plus';
												'material-theme': 'material-theme';
												'material-theme-darker': 'material-theme-darker';
												'material-theme-lighter': 'material-theme-lighter';
												'material-theme-ocean': 'material-theme-ocean';
												'material-theme-palenight': 'material-theme-palenight';
												'min-dark': 'min-dark';
												'min-light': 'min-light';
												monokai: 'monokai';
												'night-owl': 'night-owl';
												'night-owl-light': 'night-owl-light';
												nord: 'nord';
												'one-dark-pro': 'one-dark-pro';
												'one-light': 'one-light';
												plastic: 'plastic';
												poimandres: 'poimandres';
												red: 'red';
												'rose-pine': 'rose-pine';
												'rose-pine-dawn': 'rose-pine-dawn';
												'rose-pine-moon': 'rose-pine-moon';
												'slack-dark': 'slack-dark';
												'slack-ochin': 'slack-ochin';
												'snazzy-light': 'snazzy-light';
												'solarized-dark': 'solarized-dark';
												'solarized-light': 'solarized-light';
												'synthwave-84': 'synthwave-84';
												'tokyo-night': 'tokyo-night';
												vesper: 'vesper';
												'vitesse-black': 'vitesse-black';
												'vitesse-dark': 'vitesse-dark';
												'vitesse-light': 'vitesse-light';
											}>,
											z.ZodCustom<ShikiTheme, ShikiTheme>,
										]
									>
								>;
								themes: z.ZodDefault<
									z.ZodOptional<
										z.ZodRecord<
											z.ZodString,
											z.ZodUnion<
												[
													z.ZodEnum<{
														andromeeda: 'andromeeda';
														'aurora-x': 'aurora-x';
														'ayu-dark': 'ayu-dark';
														'ayu-light': 'ayu-light';
														'ayu-mirage': 'ayu-mirage';
														'catppuccin-frappe': 'catppuccin-frappe';
														'catppuccin-latte': 'catppuccin-latte';
														'catppuccin-macchiato': 'catppuccin-macchiato';
														'catppuccin-mocha': 'catppuccin-mocha';
														'dark-plus': 'dark-plus';
														dracula: 'dracula';
														'dracula-soft': 'dracula-soft';
														'everforest-dark': 'everforest-dark';
														'everforest-light': 'everforest-light';
														'github-dark': 'github-dark';
														'github-dark-default': 'github-dark-default';
														'github-dark-dimmed': 'github-dark-dimmed';
														'github-dark-high-contrast': 'github-dark-high-contrast';
														'github-light': 'github-light';
														'github-light-default': 'github-light-default';
														'github-light-high-contrast': 'github-light-high-contrast';
														'gruvbox-dark-hard': 'gruvbox-dark-hard';
														'gruvbox-dark-medium': 'gruvbox-dark-medium';
														'gruvbox-dark-soft': 'gruvbox-dark-soft';
														'gruvbox-light-hard': 'gruvbox-light-hard';
														'gruvbox-light-medium': 'gruvbox-light-medium';
														'gruvbox-light-soft': 'gruvbox-light-soft';
														horizon: 'horizon';
														'horizon-bright': 'horizon-bright';
														houston: 'houston';
														'kanagawa-dragon': 'kanagawa-dragon';
														'kanagawa-lotus': 'kanagawa-lotus';
														'kanagawa-wave': 'kanagawa-wave';
														laserwave: 'laserwave';
														'light-plus': 'light-plus';
														'material-theme': 'material-theme';
														'material-theme-darker': 'material-theme-darker';
														'material-theme-lighter': 'material-theme-lighter';
														'material-theme-ocean': 'material-theme-ocean';
														'material-theme-palenight': 'material-theme-palenight';
														'min-dark': 'min-dark';
														'min-light': 'min-light';
														monokai: 'monokai';
														'night-owl': 'night-owl';
														'night-owl-light': 'night-owl-light';
														nord: 'nord';
														'one-dark-pro': 'one-dark-pro';
														'one-light': 'one-light';
														plastic: 'plastic';
														poimandres: 'poimandres';
														red: 'red';
														'rose-pine': 'rose-pine';
														'rose-pine-dawn': 'rose-pine-dawn';
														'rose-pine-moon': 'rose-pine-moon';
														'slack-dark': 'slack-dark';
														'slack-ochin': 'slack-ochin';
														'snazzy-light': 'snazzy-light';
														'solarized-dark': 'solarized-dark';
														'solarized-light': 'solarized-light';
														'synthwave-84': 'synthwave-84';
														'tokyo-night': 'tokyo-night';
														vesper: 'vesper';
														'vitesse-black': 'vitesse-black';
														'vitesse-dark': 'vitesse-dark';
														'vitesse-light': 'vitesse-light';
													}>,
													z.ZodCustom<ShikiTheme, ShikiTheme>,
												]
											>
										>
									>
								>;
								defaultColor: z.ZodOptional<
									z.ZodUnion<
										readonly [
											z.ZodLiteral<'light'>,
											z.ZodLiteral<'dark'>,
											z.ZodString,
											z.ZodLiteral<false>,
										]
									>
								>;
								wrap: z.ZodDefault<z.ZodUnion<[z.ZodBoolean, z.ZodNull]>>;
								transformers: z.ZodDefault<
									z.ZodArray<z.ZodCustom<ShikiTransformer, ShikiTransformer>>
								>;
							},
							z.core.$strip
						>
					>;
					remarkPlugins: z.ZodDefault<
						z.ZodArray<
							z.ZodUnion<
								readonly [
									z.ZodString,
									z.ZodTuple<[z.ZodString, z.ZodAny], null>,
									z.ZodCustom<RemarkPlugin, RemarkPlugin>,
									z.ZodTuple<[z.ZodCustom<RemarkPlugin, RemarkPlugin>, z.ZodAny], null>,
								]
							>
						>
					>;
					rehypePlugins: z.ZodDefault<
						z.ZodArray<
							z.ZodUnion<
								readonly [
									z.ZodString,
									z.ZodTuple<[z.ZodString, z.ZodAny], null>,
									z.ZodCustom<RehypePlugin, RehypePlugin>,
									z.ZodTuple<[z.ZodCustom<RehypePlugin, RehypePlugin>, z.ZodAny], null>,
								]
							>
						>
					>;
					remarkRehype: z.ZodDefault<z.ZodCustom<RemarkRehype, RemarkRehype>>;
					gfm: z.ZodDefault<z.ZodBoolean>;
					smartypants: z.ZodPrefault<
						z.ZodPipe<
							z.ZodUnion<
								readonly [
									z.ZodBoolean,
									z.ZodType<Smartypants, unknown, z.core.$ZodTypeInternals<Smartypants, unknown>>,
								]
							>,
							z.ZodTransform<false | Smartypants, boolean | Smartypants>
						>
					>;
				},
				z.core.$strip
			>
		>;
		vite: z.ZodDefault<z.ZodCustom<ViteUserConfig, ViteUserConfig>>;
		i18n: z.ZodOptional<
			z.ZodOptional<
				z.ZodObject<
					{
						defaultLocale: z.ZodString;
						locales: z.ZodArray<
							z.ZodUnion<
								readonly [
									z.ZodString,
									z.ZodObject<
										{
											path: z.ZodString;
											codes: z.ZodTuple<[z.ZodString], z.ZodString>;
										},
										z.core.$strip
									>,
								]
							>
						>;
						domains: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
						fallback: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
						routing: z.ZodPrefault<
							z.ZodOptional<
								z.ZodUnion<
									[
										z.ZodLiteral<'manual'>,
										z.ZodObject<
											{
												prefixDefaultLocale: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
												redirectToDefaultLocale: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
												fallbackType: z.ZodDefault<
													z.ZodOptional<
														z.ZodEnum<{
															redirect: 'redirect';
															rewrite: 'rewrite';
														}>
													>
												>;
											},
											z.core.$strip
										>,
									]
								>
							>
						>;
					},
					z.core.$strip
				>
			>
		>;
		security: z.ZodDefault<
			z.ZodOptional<
				z.ZodObject<
					{
						checkOrigin: z.ZodDefault<z.ZodBoolean>;
						allowedDomains: z.ZodDefault<
							z.ZodOptional<
								z.ZodArray<
									z.ZodObject<
										{
											hostname: z.ZodOptional<z.ZodString>;
											protocol: z.ZodOptional<z.ZodString>;
											port: z.ZodOptional<z.ZodString>;
										},
										z.core.$strip
									>
								>
							>
						>;
						actionBodySizeLimit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
						serverIslandBodySizeLimit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
						csp: z.ZodDefault<
							z.ZodOptional<
								z.ZodUnion<
									readonly [
										z.ZodDefault<z.ZodOptional<z.ZodBoolean>>,
										z.ZodObject<
											{
												algorithm: z.ZodDefault<
													z.ZodOptional<
														z.ZodEnum<{
															'SHA-256': 'SHA-256';
															'SHA-384': 'SHA-384';
															'SHA-512': 'SHA-512';
														}>
													>
												>;
												directives: z.ZodOptional<
													z.ZodArray<
														z.ZodCustom<
															| `base-uri${string}`
															| `child-src${string}`
															| `connect-src${string}`
															| `default-src${string}`
															| `fenced-frame-src${string}`
															| `font-src${string}`
															| `form-action${string}`
															| `frame-ancestors${string}`
															| `frame-src${string}`
															| `img-src${string}`
															| `manifest-src${string}`
															| `media-src${string}`
															| `object-src${string}`
															| `referrer${string}`
															| `report-to${string}`
															| `report-uri${string}`
															| `require-trusted-types-for${string}`
															| `sandbox${string}`
															| `trusted-types${string}`
															| `upgrade-insecure-requests${string}`
															| `worker-src${string}`,
															| `base-uri${string}`
															| `child-src${string}`
															| `connect-src${string}`
															| `default-src${string}`
															| `fenced-frame-src${string}`
															| `font-src${string}`
															| `form-action${string}`
															| `frame-ancestors${string}`
															| `frame-src${string}`
															| `img-src${string}`
															| `manifest-src${string}`
															| `media-src${string}`
															| `object-src${string}`
															| `referrer${string}`
															| `report-to${string}`
															| `report-uri${string}`
															| `require-trusted-types-for${string}`
															| `sandbox${string}`
															| `trusted-types${string}`
															| `upgrade-insecure-requests${string}`
															| `worker-src${string}`
														>
													>
												>;
												styleDirective: z.ZodOptional<
													z.ZodObject<
														{
															resources: z.ZodOptional<z.ZodArray<z.ZodString>>;
															hashes: z.ZodOptional<
																z.ZodArray<
																	z.ZodCustom<
																		`sha256-${string}` | `sha384-${string}` | `sha512-${string}`,
																		`sha256-${string}` | `sha384-${string}` | `sha512-${string}`
																	>
																>
															>;
														},
														z.core.$strip
													>
												>;
												scriptDirective: z.ZodOptional<
													z.ZodObject<
														{
															resources: z.ZodOptional<z.ZodArray<z.ZodString>>;
															hashes: z.ZodOptional<
																z.ZodArray<
																	z.ZodCustom<
																		`sha256-${string}` | `sha384-${string}` | `sha512-${string}`,
																		`sha256-${string}` | `sha384-${string}` | `sha512-${string}`
																	>
																>
															>;
															strictDynamic: z.ZodOptional<z.ZodBoolean>;
														},
														z.core.$strip
													>
												>;
											},
											z.core.$strip
										>,
									]
								>
							>
						>;
					},
					z.core.$strip
				>
			>
		>;
		env: z.ZodDefault<
			z.ZodOptional<
				z.ZodObject<
					{
						schema: z.ZodDefault<
							z.ZodOptional<
								z.ZodRecord<
									z.ZodString,
									z.ZodIntersection<
										z.ZodCustom<
											| {
													context: 'client';
													access: 'public';
											  }
											| {
													context: 'server';
													access: 'public';
											  }
											| {
													context: 'server';
													access: 'secret';
											  },
											| {
													context: 'client';
													access: 'public';
											  }
											| {
													context: 'server';
													access: 'public';
											  }
											| {
													context: 'server';
													access: 'secret';
											  }
										>,
										z.ZodUnion<
											readonly [
												z.ZodObject<
													{
														type: z.ZodLiteral<'string'>;
														optional: z.ZodOptional<z.ZodBoolean>;
														default: z.ZodOptional<z.ZodString>;
														max: z.ZodOptional<z.ZodNumber>;
														min: z.ZodOptional<z.ZodNumber>;
														length: z.ZodOptional<z.ZodNumber>;
														url: z.ZodOptional<z.ZodBoolean>;
														includes: z.ZodOptional<z.ZodString>;
														startsWith: z.ZodOptional<z.ZodString>;
														endsWith: z.ZodOptional<z.ZodString>;
													},
													z.core.$strip
												>,
												z.ZodObject<
													{
														type: z.ZodLiteral<'number'>;
														optional: z.ZodOptional<z.ZodBoolean>;
														default: z.ZodOptional<z.ZodNumber>;
														gt: z.ZodOptional<z.ZodNumber>;
														min: z.ZodOptional<z.ZodNumber>;
														lt: z.ZodOptional<z.ZodNumber>;
														max: z.ZodOptional<z.ZodNumber>;
														int: z.ZodOptional<z.ZodBoolean>;
													},
													z.core.$strip
												>,
												z.ZodObject<
													{
														type: z.ZodLiteral<'boolean'>;
														optional: z.ZodOptional<z.ZodBoolean>;
														default: z.ZodOptional<z.ZodBoolean>;
													},
													z.core.$strip
												>,
												z.ZodObject<
													{
														type: z.ZodLiteral<'enum'>;
														values: z.ZodArray<z.ZodString>;
														optional: z.ZodOptional<z.ZodBoolean>;
														default: z.ZodOptional<z.ZodString>;
													},
													z.core.$strip
												>,
											]
										>
									>
								>
							>
						>;
						validateSecrets: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
					},
					z.core.$strict
				>
			>
		>;
		session: z.ZodOptional<
			z.ZodObject<
				{
					driver: z.ZodOptional<
						z.ZodUnion<
							readonly [
								z.ZodString,
								z.ZodObject<
									{
										config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
										entrypoint: z.ZodUnion<readonly [z.ZodString, z.ZodCustom<URL, URL>]>;
									},
									z.core.$strip
								>,
							]
						>
					>;
					options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
					cookie: z.ZodOptional<
						z.ZodUnion<
							readonly [
								z.ZodObject<
									{
										name: z.ZodOptional<z.ZodString>;
										domain: z.ZodOptional<z.ZodString>;
										path: z.ZodOptional<z.ZodString>;
										maxAge: z.ZodOptional<z.ZodNumber>;
										sameSite: z.ZodOptional<
											z.ZodUnion<
												readonly [
													z.ZodEnum<{
														strict: 'strict';
														lax: 'lax';
														none: 'none';
													}>,
													z.ZodBoolean,
												]
											>
										>;
										secure: z.ZodOptional<z.ZodBoolean>;
									},
									z.core.$strip
								>,
								z.ZodPipe<
									z.ZodString,
									z.ZodTransform<
										{
											name: string;
										},
										string
									>
								>,
							]
						>
					>;
					ttl: z.ZodOptional<z.ZodNumber>;
				},
				z.core.$strip
			>
		>;
		prerenderConflictBehavior: z.ZodDefault<
			z.ZodOptional<
				z.ZodEnum<{
					error: 'error';
					ignore: 'ignore';
					warn: 'warn';
				}>
			>
		>;
		fonts: z.ZodOptional<
			z.ZodArray<
				z.ZodObject<
					{
						name: z.ZodString;
						cssVariable: z.ZodString;
						provider: z.ZodCustom<
							import('../../../assets/fonts/types.js').FontProvider<never>,
							import('../../../assets/fonts/types.js').FontProvider<never>
						>;
						weights: z.ZodOptional<
							z.ZodTuple<
								[z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>],
								z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>
							>
						>;
						styles: z.ZodOptional<
							z.ZodTuple<
								[
									z.ZodEnum<{
										normal: 'normal';
										italic: 'italic';
										oblique: 'oblique';
									}>,
								],
								z.ZodEnum<{
									normal: 'normal';
									italic: 'italic';
									oblique: 'oblique';
								}>
							>
						>;
						subsets: z.ZodOptional<z.ZodTuple<[z.ZodString], z.ZodString>>;
						formats: z.ZodOptional<
							z.ZodTuple<
								[
									z.ZodEnum<{
										woff2: 'woff2';
										woff: 'woff';
										otf: 'otf';
										ttf: 'ttf';
										eot: 'eot';
									}>,
								],
								z.ZodEnum<{
									woff2: 'woff2';
									woff: 'woff';
									otf: 'otf';
									ttf: 'ttf';
									eot: 'eot';
								}>
							>
						>;
						fallbacks: z.ZodOptional<z.ZodArray<z.ZodString>>;
						optimizedFallbacks: z.ZodOptional<z.ZodBoolean>;
						display: z.ZodOptional<
							z.ZodEnum<{
								optional: 'optional';
								auto: 'auto';
								block: 'block';
								swap: 'swap';
								fallback: 'fallback';
							}>
						>;
						stretch: z.ZodOptional<z.ZodString>;
						featureSettings: z.ZodOptional<z.ZodString>;
						variationSettings: z.ZodOptional<z.ZodString>;
						unicodeRange: z.ZodOptional<z.ZodTuple<[z.ZodString], z.ZodString>>;
						options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
					},
					z.core.$strict
				>
			>
		>;
		experimental: z.ZodPrefault<
			z.ZodObject<
				{
					advancedRouting: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
					clientPrerender: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
					contentIntellisense: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
					chromeDevtoolsWorkspace: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
					svgOptimizer: z.ZodOptional<
						z.ZodObject<
							{
								name: z.ZodString;
								optimize: z.ZodCustom<
									(contents: string) => string | Promise<string>,
									(contents: string) => string | Promise<string>
								>;
							},
							z.core.$strip
						>
					>;
					cache: z.ZodOptional<
						z.ZodObject<
							{
								provider: z.ZodOptional<
									z.ZodObject<
										{
											config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
											entrypoint: z.ZodUnion<readonly [z.ZodString, z.ZodCustom<URL, URL>]>;
											name: z.ZodOptional<z.ZodString>;
										},
										z.core.$strip
									>
								>;
							},
							z.core.$strip
						>
					>;
					routeRules: z.ZodOptional<
						z.ZodRecord<
							z.ZodString,
							z.ZodObject<
								{
									maxAge: z.ZodOptional<z.ZodNumber>;
									swr: z.ZodOptional<z.ZodNumber>;
									tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
								},
								z.core.$strip
							>
						>
					>;
					rustCompiler: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
					queuedRendering: z.ZodPrefault<
						z.ZodOptional<
							z.ZodObject<
								{
									enabled: z.ZodPrefault<z.ZodOptional<z.ZodBoolean>>;
									poolSize: z.ZodOptional<z.ZodNumber>;
									contentCache: z.ZodOptional<z.ZodBoolean>;
								},
								z.core.$strip
							>
						>
					>;
					logger: z.ZodOptional<
						z.ZodObject<
							{
								entrypoint: z.ZodString;
								config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
							},
							z.core.$strip
						>
					>;
				},
				z.core.$strict
			>
		>;
		legacy: z.ZodPrefault<
			z.ZodObject<
				{
					collectionsBackwardsCompat: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
				},
				z.core.$strip
			>
		>;
	},
	z.core.$strip
>;
export type AstroConfigType = z.infer<typeof AstroConfigSchema>;
export {};

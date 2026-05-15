import type { OutgoingHttpHeaders } from 'node:http';
import * as z from 'zod/v4';
export declare function createRelativeSchema(
	cmd: string,
	fileProtocolRoot: string,
): z.ZodPipe<
	z.ZodObject<
		{
			site: z.ZodOptional<z.ZodString>;
			base: z.ZodDefault<z.ZodOptional<z.ZodString>>;
			trailingSlash: z.ZodDefault<
				z.ZodOptional<
					z.ZodUnion<
						readonly [z.ZodLiteral<'always'>, z.ZodLiteral<'never'>, z.ZodLiteral<'ignore'>]
					>
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
											z.ZodArray<
												z.ZodCustom<
													import('shiki').LanguageRegistration &
														import('./base.js').ComplexifyUnionObj,
													import('shiki').LanguageRegistration &
														import('./base.js').ComplexifyUnionObj
												>
											>,
											z.ZodTransform<
												(import('shiki').LanguageRegistration &
													import('./base.js').ComplexifyUnionObj)[],
												(import('shiki').LanguageRegistration &
													import('./base.js').ComplexifyUnionObj)[]
											>
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
												z.ZodCustom<
													NonNullable<
														| import('@astrojs/markdown-remark').ThemePresets
														| import('shiki').ThemeRegistration
														| import('shiki').ThemeRegistrationRaw
														| undefined
													> &
														import('./base.js').ComplexifyUnionObj,
													NonNullable<
														| import('@astrojs/markdown-remark').ThemePresets
														| import('shiki').ThemeRegistration
														| import('shiki').ThemeRegistrationRaw
														| undefined
													> &
														import('./base.js').ComplexifyUnionObj
												>,
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
														z.ZodCustom<
															NonNullable<
																| import('@astrojs/markdown-remark').ThemePresets
																| import('shiki').ThemeRegistration
																| import('shiki').ThemeRegistrationRaw
																| undefined
															> &
																import('./base.js').ComplexifyUnionObj,
															NonNullable<
																| import('@astrojs/markdown-remark').ThemePresets
																| import('shiki').ThemeRegistration
																| import('shiki').ThemeRegistrationRaw
																| undefined
															> &
																import('./base.js').ComplexifyUnionObj
														>,
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
										z.ZodArray<
											z.ZodCustom<
												import('shiki').ShikiTransformer & import('./base.js').ComplexifyUnionObj,
												import('shiki').ShikiTransformer & import('./base.js').ComplexifyUnionObj
											>
										>
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
										z.ZodCustom<
											import('@astrojs/markdown-remark').RemarkPlugin &
												import('./base.js').ComplexifyUnionObj,
											import('@astrojs/markdown-remark').RemarkPlugin &
												import('./base.js').ComplexifyUnionObj
										>,
										z.ZodTuple<
											[
												z.ZodCustom<
													import('@astrojs/markdown-remark').RemarkPlugin &
														import('./base.js').ComplexifyUnionObj,
													import('@astrojs/markdown-remark').RemarkPlugin &
														import('./base.js').ComplexifyUnionObj
												>,
												z.ZodAny,
											],
											null
										>,
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
										z.ZodCustom<
											import('@astrojs/markdown-remark').RehypePlugin &
												import('./base.js').ComplexifyUnionObj,
											import('@astrojs/markdown-remark').RehypePlugin &
												import('./base.js').ComplexifyUnionObj
										>,
										z.ZodTuple<
											[
												z.ZodCustom<
													import('@astrojs/markdown-remark').RehypePlugin &
														import('./base.js').ComplexifyUnionObj,
													import('@astrojs/markdown-remark').RehypePlugin &
														import('./base.js').ComplexifyUnionObj
												>,
												z.ZodAny,
											],
											null
										>,
									]
								>
							>
						>;
						remarkRehype: z.ZodDefault<
							z.ZodCustom<import('./base.js').RemarkRehype, import('./base.js').RemarkRehype>
						>;
						gfm: z.ZodDefault<z.ZodBoolean>;
						smartypants: z.ZodPrefault<
							z.ZodPipe<
								z.ZodUnion<
									readonly [
										z.ZodBoolean,
										z.ZodType<
											import('./base.js').Smartypants,
											unknown,
											z.core.$ZodTypeInternals<import('./base.js').Smartypants, unknown>
										>,
									]
								>,
								z.ZodTransform<
									false | import('./base.js').Smartypants,
									boolean | import('./base.js').Smartypants
								>
							>
						>;
					},
					z.core.$strip
				>
			>;
			vite: z.ZodDefault<
				z.ZodCustom<
					import('../../../index.js').ViteUserConfig,
					import('../../../index.js').ViteUserConfig
				>
			>;
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
								import('../../../index.js').FontProvider<never>,
								import('../../../index.js').FontProvider<never>
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
			root: z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<import('url').URL, string>>;
			srcDir: z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<import('url').URL, string>>;
			compressHTML: z.ZodDefault<
				z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodLiteral<'jsx'>]>>
			>;
			publicDir: z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<import('url').URL, string>>;
			outDir: z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<import('url').URL, string>>;
			cacheDir: z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<import('url').URL, string>>;
			build: z.ZodPrefault<
				z.ZodOptional<
					z.ZodObject<
						{
							format: z.ZodDefault<
								z.ZodOptional<
									z.ZodUnion<
										readonly [
											z.ZodLiteral<'file'>,
											z.ZodLiteral<'directory'>,
											z.ZodLiteral<'preserve'>,
										]
									>
								>
							>;
							client: z.ZodPipe<
								z.ZodDefault<z.ZodOptional<z.ZodString>>,
								z.ZodTransform<import('url').URL, string>
							>;
							server: z.ZodPipe<
								z.ZodDefault<z.ZodOptional<z.ZodString>>,
								z.ZodTransform<import('url').URL, string>
							>;
							assets: z.ZodDefault<z.ZodOptional<z.ZodString>>;
							assetsPrefix: z.ZodUnion<
								[
									z.ZodOptional<z.ZodString>,
									z.ZodOptional<
										z.ZodIntersection<
											z.ZodObject<
												{
													fallback: z.ZodString;
												},
												z.core.$strip
											>,
											z.ZodRecord<z.ZodString, z.ZodString>
										>
									>,
								]
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
		},
		z.core.$strip
	>,
	z.ZodTransform<
		{
			base: string;
			trailingSlash: 'never' | 'ignore' | 'always';
			output: 'server' | 'static';
			scopedStyleStrategy: 'where' | 'class' | 'attribute';
			integrations: {
				name: string;
				hooks: {
					[x: string]: unknown;
				};
			}[];
			redirects: Record<
				string,
				| string
				| {
						status: 301 | 302 | 303 | 307 | 308 | 300 | 304;
						destination: string;
				  }
			>;
			image: {
				endpoint: {
					route: string;
					entrypoint?: string | undefined;
				};
				service: {
					entrypoint: string;
					config: Record<string, any>;
				};
				dangerouslyProcessSVG: boolean;
				domains: string[];
				remotePatterns: {
					protocol?: string | undefined;
					hostname?: string | undefined;
					port?: string | undefined;
					pathname?: string | undefined;
				}[];
				responsiveStyles: boolean;
				layout?: 'fixed' | 'none' | 'constrained' | 'full-width' | undefined;
				objectFit?: string | undefined;
				objectPosition?: string | undefined;
				breakpoints?: number[] | undefined;
			};
			devToolbar: {
				enabled: boolean;
				placement?: 'bottom-left' | 'bottom-center' | 'bottom-right' | undefined;
			};
			markdown: {
				syntaxHighlight:
					| false
					| 'shiki'
					| 'prism'
					| {
							type: 'shiki' | 'prism';
							excludeLangs?: string[] | undefined;
					  };
				shikiConfig: {
					langs: (import('shiki').LanguageRegistration & import('./base.js').ComplexifyUnionObj)[];
					langAlias: Record<string, string>;
					theme:
						| 'andromeeda'
						| 'aurora-x'
						| 'ayu-dark'
						| 'ayu-light'
						| 'ayu-mirage'
						| 'catppuccin-frappe'
						| 'catppuccin-latte'
						| 'catppuccin-macchiato'
						| 'catppuccin-mocha'
						| 'dark-plus'
						| 'dracula'
						| 'dracula-soft'
						| 'everforest-dark'
						| 'everforest-light'
						| 'github-dark'
						| 'github-dark-default'
						| 'github-dark-dimmed'
						| 'github-dark-high-contrast'
						| 'github-light'
						| 'github-light-default'
						| 'github-light-high-contrast'
						| 'gruvbox-dark-hard'
						| 'gruvbox-dark-medium'
						| 'gruvbox-dark-soft'
						| 'gruvbox-light-hard'
						| 'gruvbox-light-medium'
						| 'gruvbox-light-soft'
						| 'horizon'
						| 'horizon-bright'
						| 'houston'
						| 'kanagawa-dragon'
						| 'kanagawa-lotus'
						| 'kanagawa-wave'
						| 'laserwave'
						| 'light-plus'
						| 'material-theme'
						| 'material-theme-darker'
						| 'material-theme-lighter'
						| 'material-theme-ocean'
						| 'material-theme-palenight'
						| 'min-dark'
						| 'min-light'
						| 'monokai'
						| 'night-owl'
						| 'night-owl-light'
						| 'nord'
						| 'one-dark-pro'
						| 'one-light'
						| 'plastic'
						| 'poimandres'
						| 'red'
						| 'rose-pine'
						| 'rose-pine-dawn'
						| 'rose-pine-moon'
						| 'slack-dark'
						| 'slack-ochin'
						| 'snazzy-light'
						| 'solarized-dark'
						| 'solarized-light'
						| 'synthwave-84'
						| 'tokyo-night'
						| 'vesper'
						| 'vitesse-black'
						| 'vitesse-dark'
						| 'vitesse-light'
						| (NonNullable<
								| import('@astrojs/markdown-remark').ThemePresets
								| import('shiki').ThemeRegistration
								| import('shiki').ThemeRegistrationRaw
								| undefined
						  > &
								import('./base.js').ComplexifyUnionObj);
					themes: Record<
						string,
						| 'andromeeda'
						| 'aurora-x'
						| 'ayu-dark'
						| 'ayu-light'
						| 'ayu-mirage'
						| 'catppuccin-frappe'
						| 'catppuccin-latte'
						| 'catppuccin-macchiato'
						| 'catppuccin-mocha'
						| 'dark-plus'
						| 'dracula'
						| 'dracula-soft'
						| 'everforest-dark'
						| 'everforest-light'
						| 'github-dark'
						| 'github-dark-default'
						| 'github-dark-dimmed'
						| 'github-dark-high-contrast'
						| 'github-light'
						| 'github-light-default'
						| 'github-light-high-contrast'
						| 'gruvbox-dark-hard'
						| 'gruvbox-dark-medium'
						| 'gruvbox-dark-soft'
						| 'gruvbox-light-hard'
						| 'gruvbox-light-medium'
						| 'gruvbox-light-soft'
						| 'horizon'
						| 'horizon-bright'
						| 'houston'
						| 'kanagawa-dragon'
						| 'kanagawa-lotus'
						| 'kanagawa-wave'
						| 'laserwave'
						| 'light-plus'
						| 'material-theme'
						| 'material-theme-darker'
						| 'material-theme-lighter'
						| 'material-theme-ocean'
						| 'material-theme-palenight'
						| 'min-dark'
						| 'min-light'
						| 'monokai'
						| 'night-owl'
						| 'night-owl-light'
						| 'nord'
						| 'one-dark-pro'
						| 'one-light'
						| 'plastic'
						| 'poimandres'
						| 'red'
						| 'rose-pine'
						| 'rose-pine-dawn'
						| 'rose-pine-moon'
						| 'slack-dark'
						| 'slack-ochin'
						| 'snazzy-light'
						| 'solarized-dark'
						| 'solarized-light'
						| 'synthwave-84'
						| 'tokyo-night'
						| 'vesper'
						| 'vitesse-black'
						| 'vitesse-dark'
						| 'vitesse-light'
						| (NonNullable<
								| import('@astrojs/markdown-remark').ThemePresets
								| import('shiki').ThemeRegistration
								| import('shiki').ThemeRegistrationRaw
								| undefined
						  > &
								import('./base.js').ComplexifyUnionObj)
					>;
					wrap: boolean | null;
					transformers: (import('shiki').ShikiTransformer &
						import('./base.js').ComplexifyUnionObj)[];
					defaultColor?: string | false | undefined;
				};
				remarkPlugins: (
					| string
					| (import('@astrojs/markdown-remark').RemarkPlugin &
							import('./base.js').ComplexifyUnionObj)
					| [string, any]
					| [
							import('@astrojs/markdown-remark').RemarkPlugin &
								import('./base.js').ComplexifyUnionObj,
							any,
					  ]
				)[];
				rehypePlugins: (
					| string
					| (import('@astrojs/markdown-remark').RehypePlugin &
							import('./base.js').ComplexifyUnionObj)
					| [string, any]
					| [
							import('@astrojs/markdown-remark').RehypePlugin &
								import('./base.js').ComplexifyUnionObj,
							any,
					  ]
				)[];
				remarkRehype: import('./base.js').RemarkRehype;
				gfm: boolean;
				smartypants: false | import('./base.js').Smartypants;
			};
			vite: import('../../../index.js').ViteUserConfig;
			security: {
				checkOrigin: boolean;
				allowedDomains: {
					hostname?: string | undefined;
					protocol?: string | undefined;
					port?: string | undefined;
				}[];
				actionBodySizeLimit: number;
				serverIslandBodySizeLimit: number;
				csp:
					| boolean
					| {
							algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512';
							directives?:
								| (
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
								  )[]
								| undefined;
							styleDirective?:
								| {
										resources?: string[] | undefined;
										hashes?:
											| (`sha256-${string}` | `sha384-${string}` | `sha512-${string}`)[]
											| undefined;
								  }
								| undefined;
							scriptDirective?:
								| {
										resources?: string[] | undefined;
										hashes?:
											| (`sha256-${string}` | `sha384-${string}` | `sha512-${string}`)[]
											| undefined;
										strictDynamic?: boolean | undefined;
								  }
								| undefined;
					  };
			};
			env: {
				schema: Record<
					string,
					(
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
					) &
						(
							| {
									type: 'string';
									optional?: boolean | undefined;
									default?: string | undefined;
									max?: number | undefined;
									min?: number | undefined;
									length?: number | undefined;
									url?: boolean | undefined;
									includes?: string | undefined;
									startsWith?: string | undefined;
									endsWith?: string | undefined;
							  }
							| {
									type: 'number';
									optional?: boolean | undefined;
									default?: number | undefined;
									gt?: number | undefined;
									min?: number | undefined;
									lt?: number | undefined;
									max?: number | undefined;
									int?: boolean | undefined;
							  }
							| {
									type: 'enum';
									values: string[];
									optional?: boolean | undefined;
									default?: string | undefined;
							  }
							| {
									type: 'boolean';
									optional?: boolean | undefined;
									default?: boolean | undefined;
							  }
						)
				>;
				validateSecrets: boolean;
			};
			prerenderConflictBehavior: 'error' | 'ignore' | 'warn';
			experimental: {
				advancedRouting: boolean;
				clientPrerender: boolean;
				contentIntellisense: boolean;
				chromeDevtoolsWorkspace: boolean;
				rustCompiler: boolean;
				queuedRendering: {
					enabled: boolean;
					poolSize?: number | undefined;
					contentCache?: boolean | undefined;
				};
				svgOptimizer?:
					| {
							name: string;
							optimize: (contents: string) => string | Promise<string>;
					  }
					| undefined;
				cache?:
					| {
							provider?:
								| {
										entrypoint: string | URL;
										config?: Record<string, any> | undefined;
										name?: string | undefined;
								  }
								| undefined;
					  }
					| undefined;
				routeRules?:
					| Record<
							string,
							{
								maxAge?: number | undefined;
								swr?: number | undefined;
								tags?: string[] | undefined;
							}
					  >
					| undefined;
				logger?:
					| {
							entrypoint: string;
							config?: Record<string, any> | undefined;
					  }
					| undefined;
			};
			legacy: {
				collectionsBackwardsCompat: boolean;
			};
			root: import('url').URL;
			srcDir: import('url').URL;
			compressHTML: boolean | 'jsx';
			publicDir: import('url').URL;
			outDir: import('url').URL;
			cacheDir: import('url').URL;
			build: {
				format: 'file' | 'directory' | 'preserve';
				client: import('url').URL;
				server: import('url').URL;
				assets: string;
				serverEntry: string;
				redirects: boolean;
				inlineStylesheets: 'never' | 'auto' | 'always';
				concurrency: number;
				assetsPrefix?:
					| string
					| ({
							fallback: string;
					  } & Record<string, string>)
					| undefined;
			};
			server: {
				open: string | boolean;
				host: string | boolean;
				port: number;
				allowedHosts: true | string[];
				headers?: OutgoingHttpHeaders | undefined;
			};
			site?: string | undefined;
			adapter?:
				| {
						name: string;
						hooks: {
							[x: string]: unknown;
						};
				  }
				| undefined;
			prefetch?:
				| boolean
				| {
						prefetchAll?: boolean | undefined;
						defaultStrategy?: 'load' | 'tap' | 'hover' | 'viewport' | undefined;
				  }
				| undefined;
			i18n?:
				| {
						defaultLocale: string;
						locales: (
							| string
							| {
									path: string;
									codes: [string, ...string[]];
							  }
						)[];
						routing:
							| 'manual'
							| {
									prefixDefaultLocale: boolean;
									redirectToDefaultLocale: boolean;
									fallbackType: 'redirect' | 'rewrite';
							  };
						domains?: Record<string, string> | undefined;
						fallback?: Record<string, string> | undefined;
				  }
				| undefined;
			session?:
				| {
						driver?:
							| string
							| {
									entrypoint: string | URL;
									config?: Record<string, any> | undefined;
							  }
							| undefined;
						options?: Record<string, any> | undefined;
						cookie?:
							| {
									name: string;
							  }
							| {
									name?: string | undefined;
									domain?: string | undefined;
									path?: string | undefined;
									maxAge?: number | undefined;
									sameSite?: boolean | 'strict' | 'lax' | 'none' | undefined;
									secure?: boolean | undefined;
							  }
							| undefined;
						ttl?: number | undefined;
				  }
				| undefined;
			fonts?:
				| {
						name: string;
						cssVariable: string;
						provider: import('../../../index.js').FontProvider<never>;
						weights?: [string | number, ...(string | number)[]] | undefined;
						styles?:
							| ['normal' | 'italic' | 'oblique', ...('normal' | 'italic' | 'oblique')[]]
							| undefined;
						subsets?: [string, ...string[]] | undefined;
						formats?:
							| [
									'woff2' | 'woff' | 'otf' | 'ttf' | 'eot',
									...('woff2' | 'woff' | 'otf' | 'ttf' | 'eot')[],
							  ]
							| undefined;
						fallbacks?: string[] | undefined;
						optimizedFallbacks?: boolean | undefined;
						display?: 'optional' | 'auto' | 'block' | 'swap' | 'fallback' | undefined;
						stretch?: string | undefined;
						featureSettings?: string | undefined;
						variationSettings?: string | undefined;
						unicodeRange?: [string, ...string[]] | undefined;
						options?: Record<string, any> | undefined;
				  }[]
				| undefined;
		},
		{
			base: string;
			trailingSlash: 'never' | 'ignore' | 'always';
			output: 'server' | 'static';
			scopedStyleStrategy: 'where' | 'class' | 'attribute';
			integrations: {
				name: string;
				hooks: {
					[x: string]: unknown;
				};
			}[];
			redirects: Record<
				string,
				| string
				| {
						status: 301 | 302 | 303 | 307 | 308 | 300 | 304;
						destination: string;
				  }
			>;
			image: {
				endpoint: {
					route: string;
					entrypoint?: string | undefined;
				};
				service: {
					entrypoint: string;
					config: Record<string, any>;
				};
				dangerouslyProcessSVG: boolean;
				domains: string[];
				remotePatterns: {
					protocol?: string | undefined;
					hostname?: string | undefined;
					port?: string | undefined;
					pathname?: string | undefined;
				}[];
				responsiveStyles: boolean;
				layout?: 'fixed' | 'none' | 'constrained' | 'full-width' | undefined;
				objectFit?: string | undefined;
				objectPosition?: string | undefined;
				breakpoints?: number[] | undefined;
			};
			devToolbar: {
				enabled: boolean;
				placement?: 'bottom-left' | 'bottom-center' | 'bottom-right' | undefined;
			};
			markdown: {
				syntaxHighlight:
					| false
					| 'shiki'
					| 'prism'
					| {
							type: 'shiki' | 'prism';
							excludeLangs?: string[] | undefined;
					  };
				shikiConfig: {
					langs: (import('shiki').LanguageRegistration & import('./base.js').ComplexifyUnionObj)[];
					langAlias: Record<string, string>;
					theme:
						| 'andromeeda'
						| 'aurora-x'
						| 'ayu-dark'
						| 'ayu-light'
						| 'ayu-mirage'
						| 'catppuccin-frappe'
						| 'catppuccin-latte'
						| 'catppuccin-macchiato'
						| 'catppuccin-mocha'
						| 'dark-plus'
						| 'dracula'
						| 'dracula-soft'
						| 'everforest-dark'
						| 'everforest-light'
						| 'github-dark'
						| 'github-dark-default'
						| 'github-dark-dimmed'
						| 'github-dark-high-contrast'
						| 'github-light'
						| 'github-light-default'
						| 'github-light-high-contrast'
						| 'gruvbox-dark-hard'
						| 'gruvbox-dark-medium'
						| 'gruvbox-dark-soft'
						| 'gruvbox-light-hard'
						| 'gruvbox-light-medium'
						| 'gruvbox-light-soft'
						| 'horizon'
						| 'horizon-bright'
						| 'houston'
						| 'kanagawa-dragon'
						| 'kanagawa-lotus'
						| 'kanagawa-wave'
						| 'laserwave'
						| 'light-plus'
						| 'material-theme'
						| 'material-theme-darker'
						| 'material-theme-lighter'
						| 'material-theme-ocean'
						| 'material-theme-palenight'
						| 'min-dark'
						| 'min-light'
						| 'monokai'
						| 'night-owl'
						| 'night-owl-light'
						| 'nord'
						| 'one-dark-pro'
						| 'one-light'
						| 'plastic'
						| 'poimandres'
						| 'red'
						| 'rose-pine'
						| 'rose-pine-dawn'
						| 'rose-pine-moon'
						| 'slack-dark'
						| 'slack-ochin'
						| 'snazzy-light'
						| 'solarized-dark'
						| 'solarized-light'
						| 'synthwave-84'
						| 'tokyo-night'
						| 'vesper'
						| 'vitesse-black'
						| 'vitesse-dark'
						| 'vitesse-light'
						| (NonNullable<
								| import('@astrojs/markdown-remark').ThemePresets
								| import('shiki').ThemeRegistration
								| import('shiki').ThemeRegistrationRaw
								| undefined
						  > &
								import('./base.js').ComplexifyUnionObj);
					themes: Record<
						string,
						| 'andromeeda'
						| 'aurora-x'
						| 'ayu-dark'
						| 'ayu-light'
						| 'ayu-mirage'
						| 'catppuccin-frappe'
						| 'catppuccin-latte'
						| 'catppuccin-macchiato'
						| 'catppuccin-mocha'
						| 'dark-plus'
						| 'dracula'
						| 'dracula-soft'
						| 'everforest-dark'
						| 'everforest-light'
						| 'github-dark'
						| 'github-dark-default'
						| 'github-dark-dimmed'
						| 'github-dark-high-contrast'
						| 'github-light'
						| 'github-light-default'
						| 'github-light-high-contrast'
						| 'gruvbox-dark-hard'
						| 'gruvbox-dark-medium'
						| 'gruvbox-dark-soft'
						| 'gruvbox-light-hard'
						| 'gruvbox-light-medium'
						| 'gruvbox-light-soft'
						| 'horizon'
						| 'horizon-bright'
						| 'houston'
						| 'kanagawa-dragon'
						| 'kanagawa-lotus'
						| 'kanagawa-wave'
						| 'laserwave'
						| 'light-plus'
						| 'material-theme'
						| 'material-theme-darker'
						| 'material-theme-lighter'
						| 'material-theme-ocean'
						| 'material-theme-palenight'
						| 'min-dark'
						| 'min-light'
						| 'monokai'
						| 'night-owl'
						| 'night-owl-light'
						| 'nord'
						| 'one-dark-pro'
						| 'one-light'
						| 'plastic'
						| 'poimandres'
						| 'red'
						| 'rose-pine'
						| 'rose-pine-dawn'
						| 'rose-pine-moon'
						| 'slack-dark'
						| 'slack-ochin'
						| 'snazzy-light'
						| 'solarized-dark'
						| 'solarized-light'
						| 'synthwave-84'
						| 'tokyo-night'
						| 'vesper'
						| 'vitesse-black'
						| 'vitesse-dark'
						| 'vitesse-light'
						| (NonNullable<
								| import('@astrojs/markdown-remark').ThemePresets
								| import('shiki').ThemeRegistration
								| import('shiki').ThemeRegistrationRaw
								| undefined
						  > &
								import('./base.js').ComplexifyUnionObj)
					>;
					wrap: boolean | null;
					transformers: (import('shiki').ShikiTransformer &
						import('./base.js').ComplexifyUnionObj)[];
					defaultColor?: string | false | undefined;
				};
				remarkPlugins: (
					| string
					| (import('@astrojs/markdown-remark').RemarkPlugin &
							import('./base.js').ComplexifyUnionObj)
					| [string, any]
					| [
							import('@astrojs/markdown-remark').RemarkPlugin &
								import('./base.js').ComplexifyUnionObj,
							any,
					  ]
				)[];
				rehypePlugins: (
					| string
					| (import('@astrojs/markdown-remark').RehypePlugin &
							import('./base.js').ComplexifyUnionObj)
					| [string, any]
					| [
							import('@astrojs/markdown-remark').RehypePlugin &
								import('./base.js').ComplexifyUnionObj,
							any,
					  ]
				)[];
				remarkRehype: import('./base.js').RemarkRehype;
				gfm: boolean;
				smartypants: false | import('./base.js').Smartypants;
			};
			vite: import('../../../index.js').ViteUserConfig;
			security: {
				checkOrigin: boolean;
				allowedDomains: {
					hostname?: string | undefined;
					protocol?: string | undefined;
					port?: string | undefined;
				}[];
				actionBodySizeLimit: number;
				serverIslandBodySizeLimit: number;
				csp:
					| boolean
					| {
							algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512';
							directives?:
								| (
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
								  )[]
								| undefined;
							styleDirective?:
								| {
										resources?: string[] | undefined;
										hashes?:
											| (`sha256-${string}` | `sha384-${string}` | `sha512-${string}`)[]
											| undefined;
								  }
								| undefined;
							scriptDirective?:
								| {
										resources?: string[] | undefined;
										hashes?:
											| (`sha256-${string}` | `sha384-${string}` | `sha512-${string}`)[]
											| undefined;
										strictDynamic?: boolean | undefined;
								  }
								| undefined;
					  };
			};
			env: {
				schema: Record<
					string,
					(
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
					) &
						(
							| {
									type: 'string';
									optional?: boolean | undefined;
									default?: string | undefined;
									max?: number | undefined;
									min?: number | undefined;
									length?: number | undefined;
									url?: boolean | undefined;
									includes?: string | undefined;
									startsWith?: string | undefined;
									endsWith?: string | undefined;
							  }
							| {
									type: 'number';
									optional?: boolean | undefined;
									default?: number | undefined;
									gt?: number | undefined;
									min?: number | undefined;
									lt?: number | undefined;
									max?: number | undefined;
									int?: boolean | undefined;
							  }
							| {
									type: 'enum';
									values: string[];
									optional?: boolean | undefined;
									default?: string | undefined;
							  }
							| {
									type: 'boolean';
									optional?: boolean | undefined;
									default?: boolean | undefined;
							  }
						)
				>;
				validateSecrets: boolean;
			};
			prerenderConflictBehavior: 'error' | 'ignore' | 'warn';
			experimental: {
				advancedRouting: boolean;
				clientPrerender: boolean;
				contentIntellisense: boolean;
				chromeDevtoolsWorkspace: boolean;
				rustCompiler: boolean;
				queuedRendering: {
					enabled: boolean;
					poolSize?: number | undefined;
					contentCache?: boolean | undefined;
				};
				svgOptimizer?:
					| {
							name: string;
							optimize: (contents: string) => string | Promise<string>;
					  }
					| undefined;
				cache?:
					| {
							provider?:
								| {
										entrypoint: string | URL;
										config?: Record<string, any> | undefined;
										name?: string | undefined;
								  }
								| undefined;
					  }
					| undefined;
				routeRules?:
					| Record<
							string,
							{
								maxAge?: number | undefined;
								swr?: number | undefined;
								tags?: string[] | undefined;
							}
					  >
					| undefined;
				logger?:
					| {
							entrypoint: string;
							config?: Record<string, any> | undefined;
					  }
					| undefined;
			};
			legacy: {
				collectionsBackwardsCompat: boolean;
			};
			root: import('url').URL;
			srcDir: import('url').URL;
			compressHTML: boolean | 'jsx';
			publicDir: import('url').URL;
			outDir: import('url').URL;
			cacheDir: import('url').URL;
			build: {
				format: 'file' | 'directory' | 'preserve';
				client: import('url').URL;
				server: import('url').URL;
				assets: string;
				serverEntry: string;
				redirects: boolean;
				inlineStylesheets: 'never' | 'auto' | 'always';
				concurrency: number;
				assetsPrefix?:
					| string
					| ({
							fallback: string;
					  } & Record<string, string>)
					| undefined;
			};
			server: {
				open: string | boolean;
				host: string | boolean;
				port: number;
				allowedHosts: true | string[];
				headers?: OutgoingHttpHeaders | undefined;
			};
			site?: string | undefined;
			adapter?:
				| {
						name: string;
						hooks: {
							[x: string]: unknown;
						};
				  }
				| undefined;
			prefetch?:
				| boolean
				| {
						prefetchAll?: boolean | undefined;
						defaultStrategy?: 'load' | 'tap' | 'hover' | 'viewport' | undefined;
				  }
				| undefined;
			i18n?:
				| {
						defaultLocale: string;
						locales: (
							| string
							| {
									path: string;
									codes: [string, ...string[]];
							  }
						)[];
						routing:
							| 'manual'
							| {
									prefixDefaultLocale: boolean;
									redirectToDefaultLocale: boolean;
									fallbackType: 'redirect' | 'rewrite';
							  };
						domains?: Record<string, string> | undefined;
						fallback?: Record<string, string> | undefined;
				  }
				| undefined;
			session?:
				| {
						driver?:
							| string
							| {
									entrypoint: string | URL;
									config?: Record<string, any> | undefined;
							  }
							| undefined;
						options?: Record<string, any> | undefined;
						cookie?:
							| {
									name: string;
							  }
							| {
									name?: string | undefined;
									domain?: string | undefined;
									path?: string | undefined;
									maxAge?: number | undefined;
									sameSite?: boolean | 'strict' | 'lax' | 'none' | undefined;
									secure?: boolean | undefined;
							  }
							| undefined;
						ttl?: number | undefined;
				  }
				| undefined;
			fonts?:
				| {
						name: string;
						cssVariable: string;
						provider: import('../../../index.js').FontProvider<never>;
						weights?: [string | number, ...(string | number)[]] | undefined;
						styles?:
							| ['normal' | 'italic' | 'oblique', ...('normal' | 'italic' | 'oblique')[]]
							| undefined;
						subsets?: [string, ...string[]] | undefined;
						formats?:
							| [
									'woff2' | 'woff' | 'otf' | 'ttf' | 'eot',
									...('woff2' | 'woff' | 'otf' | 'ttf' | 'eot')[],
							  ]
							| undefined;
						fallbacks?: string[] | undefined;
						optimizedFallbacks?: boolean | undefined;
						display?: 'optional' | 'auto' | 'block' | 'swap' | 'fallback' | undefined;
						stretch?: string | undefined;
						featureSettings?: string | undefined;
						variationSettings?: string | undefined;
						unicodeRange?: [string, ...string[]] | undefined;
						options?: Record<string, any> | undefined;
				  }[]
				| undefined;
		}
	>
>;

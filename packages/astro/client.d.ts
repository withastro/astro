/// <reference types="vite/types/import-meta.d.ts" />

// eslint-disable-next-line  @typescript-eslint/no-namespace
declare namespace App {
	// eslint-disable-next-line  @typescript-eslint/no-empty-interface
	export interface Locals {}
}

interface ImportMetaEnv {
	/**
	 * The prefix for Astro-generated asset links if the build.assetsPrefix config option is set. This can be used to create asset links not handled by Astro.
	 */
	readonly ASSETS_PREFIX: string;
	/**
	 * This is set to the site option specified in your project’s Astro config file.
	 */
	readonly SITE: string;
}

interface ImportMeta {
	/**
	 * Astro and Vite expose environment variables through `import.meta.env`. For a complete list of the environment variables available, see the two references below.
	 *
	 * - [Astro reference](https://docs.astro.build/en/guides/environment-variables/#default-environment-variables)
	 * - [Vite reference](https://vitejs.dev/guide/env-and-mode.html#env-variables)
	 */
	readonly env: ImportMetaEnv;
}

declare module 'astro:assets' {
	// Exporting things one by one is a bit cumbersome, not sure if there's a better way - erika, 2023-02-03
	type AstroAssets = {
		// getImage's type here is different from the internal function since the Vite module implicitly pass the service config
		/**
		 * Get an optimized image and the necessary attributes to render it.
		 *
		 * **Example**
		 * ```astro
		 * ---
		 * import { getImage } from 'astro:assets';
		 * import originalImage from '../assets/image.png';
		 *
		 * const optimizedImage = await getImage({src: originalImage, width: 1280 });
		 * ---
		 * <img src={optimizedImage.src} {...optimizedImage.attributes} />
		 * ```
		 *
		 * This is functionally equivalent to using the `<Image />` component, as the component calls this function internally.
		 */
		getImage: (
			options: import('./dist/assets/types.js').UnresolvedImageTransform
		) => Promise<import('./dist/assets/types.js').GetImageResult>;
		imageConfig: import('./dist/@types/astro.js').AstroConfig['image'];
		getConfiguredImageService: typeof import('./dist/assets/index.js').getConfiguredImageService;
		Image: typeof import('./components/Image.astro').default;
		Picture: typeof import('./components/Picture.astro').default;
	};

	type ImgAttributes = import('./dist/type-utils.js').WithRequired<
		Omit<import('./types').HTMLAttributes<'img'>, 'src' | 'width' | 'height'>,
		'alt'
	>;

	export type LocalImageProps = import('./dist/type-utils.js').Simplify<
		import('./dist/assets/types.js').LocalImageProps<ImgAttributes>
	>;
	export type RemoteImageProps = import('./dist/type-utils.js').Simplify<
		import('./dist/assets/types.js').RemoteImageProps<ImgAttributes>
	>;
	export const { getImage, getConfiguredImageService, imageConfig, Image, Picture }: AstroAssets;
}

type ImageMetadata = import('./dist/assets/types.js').ImageMetadata;

declare module '*.gif' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.jpeg' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.jpg' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.png' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.tiff' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.webp' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.svg' {
	const metadata: ImageMetadata;
	export default metadata;
}
declare module '*.avif' {
	const metadata: ImageMetadata;
	export default metadata;
}

declare module 'astro:transitions' {
	type TransitionModule = typeof import('./dist/virtual-modules/transitions.js');
	export const slide: TransitionModule['slide'];
	export const fade: TransitionModule['fade'];
	export const createAnimationScope: TransitionModule['createAnimationScope'];

	type ViewTransitionsModule = typeof import('./components/ViewTransitions.astro');
	export const ViewTransitions: ViewTransitionsModule['default'];
}

declare module 'astro:transitions/client' {
	type TransitionRouterModule = typeof import('./dist/virtual-modules/transitions-router.js');
	export const navigate: TransitionRouterModule['navigate'];

	type TransitionUtilModule = typeof import('./dist/virtual-modules/transitions-util.js');
	export const supportsViewTransitions: TransitionUtilModule['supportsViewTransitions'];
	export const getFallback: TransitionUtilModule['getFallback'];
	export const transitionEnabledOnThisPage: TransitionUtilModule['transitionEnabledOnThisPage'];

	export type Fallback = import('./dist/virtual-modules/transitions-types.js').Fallback;
	export type Direction = import('./dist/virtual-modules/transitions-types.ts').Direction;
	export type NavigationTypeString =
		import('./dist/virtual-modules/transitions-types.js').NavigationTypeString;
	export type Options = import('./dist/virtual-modules/transitions-types.js').Options;

	type EventModule = typeof import('./dist/virtual-modules/transitions-events.js');
	export const TRANSITION_BEFORE_PREPARATION: EventModule['TRANSITION_BEFORE_PREPARATION'];
	export const TRANSITION_AFTER_PREPARATION: EventModule['TRANSITION_AFTER_PREPARATION'];
	export const TRANSITION_BEFORE_SWAP: EventModule['TRANSITION_BEFORE_SWAP'];
	export const TRANSITION_AFTER_SWAP: EventModule['TRANSITION_AFTER_SWAP'];
	export const TRANSITION_PAGE_LOAD: EventModule['TRANSITION_PAGE_LOAD'];
	export type TransitionBeforePreparationEvent =
		import('./dist/virtual-modules/transitions-events.js').TransitionBeforePreparationEvent;
	export type TransitionBeforeSwapEvent =
		import('./dist/virtual-modules/transitions-events.js').TransitionBeforeSwapEvent;
	export const isTransitionBeforePreparationEvent: EventModule['isTransitionBeforePreparationEvent'];
	export const isTransitionBeforeSwapEvent: EventModule['isTransitionBeforeSwapEvent'];
}

declare module 'astro:prefetch' {
	export { prefetch, PrefetchOptions } from 'astro/virtual-modules/prefetch.js';
}

declare module 'astro:i18n' {
	export type GetLocaleOptions = import('./dist/virtual-modules/i18n.js').GetLocaleOptions;

	/**
	 * @param {string} locale A locale
	 * @param {string} [path=""] An optional path to add after the `locale`.
	 * @param {import('./dist/virtual-modules/i18n.js').GetLocaleOptions} options Customise the generated path
	 * @return {string}
	 *
	 * Returns a _relative_ path with passed locale.
	 *
	 * ## Errors
	 *
	 * Throws an error if the locale doesn't exist in the list of locales defined in the configuration.
	 *
	 * ## Examples
	 *
	 * ```js
	 * import { getRelativeLocaleUrl } from "astro:i18n";
	 * getRelativeLocaleUrl("es"); // /es
	 * getRelativeLocaleUrl("es", "getting-started"); // /es/getting-started
	 * getRelativeLocaleUrl("es_US", "getting-started", { prependWith: "blog" }); // /blog/es-us/getting-started
	 * getRelativeLocaleUrl("es_US", "getting-started", { prependWith: "blog", normalizeLocale: false }); // /blog/es_US/getting-started
	 * ```
	 */
	export const getRelativeLocaleUrl: (
		locale: string,
		path?: string,
		options?: GetLocaleOptions
	) => string;

	/**
	 *
	 * @param {string} locale A locale
	 * @param {string} [path=""] An optional path to add after the `locale`.
	 * @param {import('./dist/virtual-modules/i18n.js').GetLocaleOptions} options Customise the generated path
	 * @return {string}
	 *
	 * Returns an absolute path with the passed locale. The behaviour is subject to change based on `site` configuration.
	 * If _not_ provided, the function will return a _relative_ URL.
	 *
	 * ## Errors
	 *
	 * Throws an error if the locale doesn't exist in the list of locales defined in the configuration.
	 *
	 * ## Examples
	 *
	 * If `site` is `https://example.com`:
	 *
	 * ```js
	 * import { getAbsoluteLocaleUrl } from "astro:i18n";
	 * getAbsoluteLocaleUrl("es"); // https://example.com/es
	 * getAbsoluteLocaleUrl("es", "getting-started"); // https://example.com/es/getting-started
	 * getAbsoluteLocaleUrl("es_US", "getting-started", { prependWith: "blog" }); // https://example.com/blog/es-us/getting-started
	 * getAbsoluteLocaleUrl("es_US", "getting-started", { prependWith: "blog", normalizeLocale: false }); // https://example.com/blog/es_US/getting-started
	 * ```
	 */
	export const getAbsoluteLocaleUrl: (
		locale: string,
		path?: string,
		options?: GetLocaleOptions
	) => string;

	/**
	 * @param {string} [path=""] An optional path to add after the `locale`.
	 * @param {import('./dist/virtual-modules/i18n.js').GetLocaleOptions} options Customise the generated path
	 * @return {string[]}
	 *
	 * Works like `getRelativeLocaleUrl` but it emits the relative URLs for ALL locales:
	 */
	export const getRelativeLocaleUrlList: (path?: string, options?: GetLocaleOptions) => string[];
	/**
	 * @param {string} [path=""] An optional path to add after the `locale`.
	 * @param {import('./dist/virtual-modules/i18n.js').GetLocaleOptions} options Customise the generated path
	 * @return {string[]}
	 *
	 * Works like `getAbsoluteLocaleUrl` but it emits the absolute URLs for ALL locales:
	 */
	export const getAbsoluteLocaleUrlList: (path?: string, options?: GetLocaleOptions) => string[];

	/**
	 * A function that return the `path` associated to a locale (defined as code). It's particularly useful in case you decide
	 * to use locales that are broken down in paths and codes.
	 *
	 * @param {string} code The code of the locale
	 * @returns {string} The path associated to the locale
	 *
	 * ## Example
	 *
	 * ```js
	 * // astro.config.mjs
	 *
	 * export default defineConfig({
	 * 	i18n: {
	 * 		locales: [
	 * 			{ codes: ["it", "it-VT"], path: "italiano" },
	 * 			"es"
	 * 		]
	 * 	}
	 * })
	 * ```
	 *
	 * ```js
	 * import { getPathByLocale } from "astro:i18n";
	 * getPathByLocale("it"); // returns "italiano"
	 * getPathByLocale("it-VT"); // returns "italiano"
	 * getPathByLocale("es"); // returns "es"
	 * ```
	 */
	export const getPathByLocale: (code: string) => string;

	/**
	 * A function that returns the preferred locale given a certain path. This is particularly useful if you configure a locale using
	 * `path` and `codes`. When you define multiple `code`, this function will return the first code of the array.
	 *
	 * Astro will treat the first code as the one that the user prefers.
	 *
	 * @param {string} path The path that maps to a locale
	 * @returns {string} The path associated to the locale
	 *
	 * ## Example
	 *
	 * ```js
	 * // astro.config.mjs
	 *
	 * export default defineConfig({
	 * 	i18n: {
	 * 		locales: [
	 * 			{ codes: ["it-VT", "it"], path: "italiano" },
	 * 			"es"
	 * 		]
	 * 	}
	 * })
	 * ```
	 *
	 * ```js
	 * import { getLocaleByPath } from "astro:i18n";
	 * getLocaleByPath("italiano"); // returns "it-VT" because that's the first code configured
	 * getLocaleByPath("es"); // returns "es"
	 * ```
	 */
	export const getLocaleByPath: (path: string) => string;
}

declare module 'astro:middleware' {
	export * from 'astro/virtual-modules/middleware.js';
}

declare module 'astro:components' {
	export * from 'astro/components';
}

type MD = import('./dist/@types/astro.js').MarkdownInstance<Record<string, any>>;
interface ExportedMarkdownModuleEntities {
	frontmatter: MD['frontmatter'];
	file: MD['file'];
	url: MD['url'];
	getHeadings: MD['getHeadings'];
	Content: MD['Content'];
	rawContent: MD['rawContent'];
	compiledContent: MD['compiledContent'];
	load: MD['default'];
}

declare module '*.md' {
	const { load }: ExportedMarkdownModuleEntities;
	export const {
		frontmatter,
		file,
		url,
		getHeadings,
		getHeaders,
		Content,
		rawContent,
		compiledContent,
	}: ExportedMarkdownModuleEntities;
	export default load;
}

declare module '*.markdown' {
	const { load }: ExportedMarkdownModuleEntities;
	export const {
		frontmatter,
		file,
		url,
		getHeadings,
		getHeaders,
		Content,
		rawContent,
		compiledContent,
	}: ExportedMarkdownModuleEntities;
	export default load;
}

declare module '*.mkdn' {
	const { load }: ExportedMarkdownModuleEntities;
	export const {
		frontmatter,
		file,
		url,
		getHeadings,
		getHeaders,
		Content,
		rawContent,
		compiledContent,
	}: ExportedMarkdownModuleEntities;
	export default load;
}

declare module '*.mkd' {
	const { load }: ExportedMarkdownModuleEntities;
	export const {
		frontmatter,
		file,
		url,
		getHeadings,
		getHeaders,
		Content,
		rawContent,
		compiledContent,
	}: ExportedMarkdownModuleEntities;
	export default load;
}

declare module '*.mdwn' {
	const { load }: ExportedMarkdownModuleEntities;
	export const {
		frontmatter,
		file,
		url,
		getHeadings,
		getHeaders,
		Content,
		rawContent,
		compiledContent,
	}: ExportedMarkdownModuleEntities;
	export default load;
}

declare module '*.mdown' {
	const { load }: ExportedMarkdownModuleEntities;
	export const {
		frontmatter,
		file,
		url,
		getHeadings,
		getHeaders,
		Content,
		rawContent,
		compiledContent,
	}: ExportedMarkdownModuleEntities;
	export default load;
}

declare module '*.mdx' {
	type MDX = import('./dist/@types/astro.js').MDXInstance<Record<string, any>>;

	export const frontmatter: MDX['frontmatter'];
	export const file: MDX['file'];
	export const url: MDX['url'];
	export const getHeadings: MDX['getHeadings'];
	export const Content: MDX['Content'];

	const load: MDX['default'];
	export default load;
}

declare module 'astro:ssr-manifest' {
	export const manifest: import('./dist/@types/astro.js').SSRManifest;
}

// Everything below are Vite's types (apart from image types, which are in `client.d.ts`)

// CSS modules
type CSSModuleClasses = { readonly [key: string]: string };

declare module '*.module.css' {
	const classes: CSSModuleClasses;
	export default classes;
}
declare module '*.module.scss' {
	const classes: CSSModuleClasses;
	export default classes;
}
declare module '*.module.sass' {
	const classes: CSSModuleClasses;
	export default classes;
}
declare module '*.module.less' {
	const classes: CSSModuleClasses;
	export default classes;
}
declare module '*.module.styl' {
	const classes: CSSModuleClasses;
	export default classes;
}
declare module '*.module.stylus' {
	const classes: CSSModuleClasses;
	export default classes;
}
declare module '*.module.pcss' {
	const classes: CSSModuleClasses;
	export default classes;
}
declare module '*.module.sss' {
	const classes: CSSModuleClasses;
	export default classes;
}

// CSS
declare module '*.css' {
	const css: string;
	export default css;
}
declare module '*.scss' {
	const css: string;
	export default css;
}
declare module '*.sass' {
	const css: string;
	export default css;
}
declare module '*.less' {
	const css: string;
	export default css;
}
declare module '*.styl' {
	const css: string;
	export default css;
}
declare module '*.stylus' {
	const css: string;
	export default css;
}
declare module '*.pcss' {
	const css: string;
	export default css;
}
declare module '*.sss' {
	const css: string;
	export default css;
}

// Built-in asset types
// see `src/node/constants.ts`

// images
declare module '*.jfif' {
	const src: string;
	export default src;
}
declare module '*.pjpeg' {
	const src: string;
	export default src;
}
declare module '*.pjp' {
	const src: string;
	export default src;
}
declare module '*.ico' {
	const src: string;
	export default src;
}

// media
declare module '*.mp4' {
	const src: string;
	export default src;
}
declare module '*.webm' {
	const src: string;
	export default src;
}
declare module '*.ogg' {
	const src: string;
	export default src;
}
declare module '*.mp3' {
	const src: string;
	export default src;
}
declare module '*.wav' {
	const src: string;
	export default src;
}
declare module '*.flac' {
	const src: string;
	export default src;
}
declare module '*.aac' {
	const src: string;
	export default src;
}

declare module '*.opus' {
	const src: string;
	export default src;
}

// fonts
declare module '*.woff' {
	const src: string;
	export default src;
}
declare module '*.woff2' {
	const src: string;
	export default src;
}
declare module '*.eot' {
	const src: string;
	export default src;
}
declare module '*.ttf' {
	const src: string;
	export default src;
}
declare module '*.otf' {
	const src: string;
	export default src;
}

// other
declare module '*.webmanifest' {
	const src: string;
	export default src;
}
declare module '*.pdf' {
	const src: string;
	export default src;
}
declare module '*.txt' {
	const src: string;
	export default src;
}

// wasm?init
declare module '*.wasm?init' {
	const initWasm: (options: WebAssembly.Imports) => Promise<WebAssembly.Instance>;
	export default initWasm;
}

// web worker
declare module '*?worker' {
	const workerConstructor: {
		new (): Worker;
	};
	export default workerConstructor;
}

declare module '*?worker&inline' {
	const workerConstructor: {
		new (): Worker;
	};
	export default workerConstructor;
}

declare module '*?worker&url' {
	const src: string;
	export default src;
}

declare module '*?sharedworker' {
	const sharedWorkerConstructor: {
		new (): SharedWorker;
	};
	export default sharedWorkerConstructor;
}

declare module '*?sharedworker&inline' {
	const sharedWorkerConstructor: {
		new (): SharedWorker;
	};
	export default sharedWorkerConstructor;
}

declare module '*?sharedworker&url' {
	const src: string;
	export default src;
}

declare module '*?raw' {
	const src: string;
	export default src;
}

declare module '*?url' {
	const src: string;
	export default src;
}

declare module '*?inline' {
	const src: string;
	export default src;
}

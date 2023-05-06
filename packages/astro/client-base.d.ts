/// <reference path="./import-meta.d.ts" />

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
			options: import('./dist/assets/types.js').ImageTransform
		) => Promise<import('./dist/assets/types.js').GetImageResult>;
		getConfiguredImageService: typeof import('./dist/assets/index.js').getConfiguredImageService;
		Image: typeof import('./components/Image.astro').default;
	};

	type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
	type Simplify<T> = { [KeyType in keyof T]: T[KeyType] };
	type ImgAttributes = WithRequired<
		Omit<import('./types').HTMLAttributes<'img'>, 'src' | 'width' | 'height'>,
		'alt'
	>;

	export type LocalImageProps = Simplify<
		import('./dist/assets/types.js').LocalImageProps<ImgAttributes>
	>;
	export type RemoteImageProps = Simplify<
		import('./dist/assets/types.js').RemoteImageProps<ImgAttributes>
	>;
	export const { getImage, getConfiguredImageService, Image }: AstroAssets;
}

type MD = import('./dist/@types/astro').MarkdownInstance<Record<string, any>>;
interface ExportedMarkdownModuleEntities {
	frontmatter: MD['frontmatter'];
	file: MD['file'];
	url: MD['url'];
	getHeadings: MD['getHeadings'];
	/** @deprecated Renamed to `getHeadings()` */
	getHeaders: () => void;
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
	type MDX = import('./dist/@types/astro').MDXInstance<Record<string, any>>;

	export const frontmatter: MDX['frontmatter'];
	export const file: MDX['file'];
	export const url: MDX['url'];
	export const getHeadings: MDX['getHeadings'];
	export const Content: MDX['Content'];

	const load: MDX['default'];
	export default load;
}

declare module 'astro:ssr-manifest' {
	export const manifest: import('./dist/@types/astro').SSRManifest;
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

// eslint-disable-next-line  @typescript-eslint/no-namespace
declare namespace App {
	// eslint-disable-next-line  @typescript-eslint/no-empty-interface
	export interface Locals {}
}

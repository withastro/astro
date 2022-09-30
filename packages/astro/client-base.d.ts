/// <reference path="./import-meta.d.ts" />

declare module '*.md' {
	type MD = import('./dist/@types/astro').MarkdownInstance<Record<string, any>>;

	export const frontmatter: MD['frontmatter'];
	export const file: MD['file'];
	export const url: MD['url'];
	export const getHeadings: MD['getHeadings'];
	/** @deprecated Renamed to `getHeadings()` */
	export const getHeaders: () => void;
	export const Content: MD['Content'];
	export const rawContent: MD['rawContent'];
	export const compiledContent: MD['compiledContent'];

	const load: MD['default'];
	export default load;
}

declare module '*.mdx' {
	type MDX = import('./dist/@types/astro').MDXInstance<Record<string, any>>;

	export const frontmatter: MDX['frontmatter'];
	export const file: MDX['file'];
	export const url: MDX['url'];
	export const getHeadings: MDX['getHeadings'];
	export const Content: MDX['Content'];
	export const rawContent: MDX['rawContent'];
	export const compiledContent: MDX['compiledContent'];

	const load: MDX['default'];
	export default load;
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

// Built-in asset types
// see `src/constants.ts`

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
declare module '*.wasm' {
	const initWasm: (options: WebAssembly.Imports) => Promise<WebAssembly.Exports>;
	export default initWasm;
}
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

declare module '*?sharedworker' {
	const sharedWorkerConstructor: {
		new (): SharedWorker;
	};
	export default sharedWorkerConstructor;
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

// File vendored from Vite itself, as a workaround to https://github.com/vitejs/vite/pull/9827 until Vite 4 comes out

// This file is an augmentation to the built-in ImportMeta interface
// Thus cannot contain any top-level imports
// <https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation>

/* eslint-disable @typescript-eslint/consistent-type-imports */

// Duplicate of import('../src/node/importGlob').GlobOptions in order to
// avoid breaking the production client type. Because this file is referenced
// in vite/client.d.ts and in production src/node/importGlob.ts doesn't exist.
interface GlobOptions {
	as?: string;
}

interface ImportMeta {
	url: string;

	readonly hot?: import('vite/types/hot').ViteHotContext;

	readonly env: ImportMetaEnv;

	glob: import('vite/types/importGlob').ImportGlobFunction;
	/**
	 * @deprecated Use `import.meta.glob('*', { eager: true })` instead
	 */
	globEager: import('vite/types/importGlob').ImportGlobEagerFunction;
}

interface ImportMetaEnv {
	[key: string]: any;
	BASE_URL: string;
	MODE: string;
	DEV: boolean;
	PROD: boolean;
	SSR: boolean;
}

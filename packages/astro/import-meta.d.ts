// File vendored from Vite itself, as a workaround to https://github.com/vitejs/vite/issues/13309 until Vite 5 comes out

// This file is an augmentation to the built-in ImportMeta interface
// Thus cannot contain any top-level imports
// <https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation>

/* eslint-disable @typescript-eslint/consistent-type-imports */

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

import 'svelte2tsx/svelte-shims-v4';

import type { JSX } from 'astro/jsx-runtime';

export type AstroClientDirectives = JSX.AstroComponentDirectives;

type Snippet = import('svelte').Snippet;

/**
 * Helper to detect index-signature-like keys.
 */
type IsIndexSignatureKey<K> = string extends K
	? true
	: number extends K
		? true
		: symbol extends K
			? true
			: false;

/**
 * Removes index signatures whose value type is `never`.
 * (Keeps normal, explicitly-declared keys unchanged.)
 */
export type StripNeverIndexSignatures<T> = {
	[K in keyof T as IsIndexSignatureKey<K> extends true
		? [T[K]] extends [never]
			? never
			: K
		: K]: T[K];
};

/**
 * If `children` exists and is `never`, make it `{ children?: undefined }`
 * (works even when it was required).
 * If `children` doesn't exist, add `{ children?: undefined }`.
 */
type NormalizeNeverChildren<T> = 'children' extends keyof T
	? [T['children']] extends [never]
		? Omit<T, 'children'> & { children?: undefined }
		: T
	: T & { children?: undefined };

/**
 * If `children` includes `Snippet` (even as part of a union), widen to `any`
 * to allow arbitrary content.
 */
type WidenChildrenIfSnippet<T> = {
	[K in keyof T]: K extends 'children'
		? Extract<NonNullable<T[K]>, Snippet> extends never
			? T[K]
			: any
		: T[K];
};

/**
 * Detect `any` without triggering on generic type parameters.
 * `0 extends 1 & T` is `true` only when `T` is `any`.
 */
type IsAny<T> = 0 extends 1 & T ? true : false;

/**
 * Check whether a prop type is `Snippet`-like or `any` (which subsumes `Snippet`).
 * Returns `true` for `any`, `Snippet`, `Snippet<[...]>`, `Snippet | null`, etc.
 * Returns `false` for concrete non-snippet types and deferred generic parameters.
 */
type IsSnippetOrAny<T> =
	IsAny<T> extends true ? true : Extract<NonNullable<T>, Snippet> extends never ? false : true;

/**
 * Handle Snippet-typed and `any`-typed props for Astro compatibility:
 * - `children` that includes `Snippet`: widen to `any` (Astro slot/content)
 * - Other props whose type is `any` or includes `Snippet`: make optional.
 *   `svelte2tsx` types renamed/destructured snippet props and event handlers
 *   as `any` without marking them optional, even when they have defaults.
 *   Astro cannot pass Svelte snippets, so these are safe to omit.
 *
 * NOTE: This type uses an intersection of two mapped types, which breaks
 * TypeScript's generic type parameter inference. Use `GenericPropsWithClientDirectives`
 * for generic Svelte components instead.
 */
type HandleSnippetProps<T> = {
	[K in keyof T as K extends 'children'
		? K
		: IsSnippetOrAny<T[K]> extends true
			? never
			: K]: K extends 'children'
		? Extract<NonNullable<T[K]>, Snippet> extends never
			? T[K]
			: any
		: T[K];
} & {
	[K in keyof T as K extends 'children'
		? never
		: IsSnippetOrAny<T[K]> extends true
			? K
			: never]?: T[K];
};

/**
 * `T` (Svelte props) made safe for Astro:
 * - Normalize `children` (avoid `never`/missing cases)
 * - Widen snippet-based `children` to `any` (Astro slot/content compatibility)
 * - Make snippet/any-typed non-children props optional
 * - Strip useless `never` index signatures (allow extra keys like `client:*`)
 * - Add Astro client directives
 */
export type PropsWithClientDirectives<T> = StripNeverIndexSignatures<
	HandleSnippetProps<NormalizeNeverChildren<T>>
> &
	AstroClientDirectives;

/**
 * `T` (Svelte props) made safe for Astro (generic components):
 * Uses a simpler homomorphic mapped type that preserves generic inference.
 * - Normalize `children` (avoid `never`/missing cases)
 * - Widen snippet-based `children` to `any` (Astro slot/content compatibility)
 * - Strip useless `never` index signatures (allow extra keys like `client:*`)
 * - Add Astro client directives
 */
export type GenericPropsWithClientDirectives<T> = StripNeverIndexSignatures<
	WidenChildrenIfSnippet<NormalizeNeverChildren<T>>
> &
	AstroClientDirectives;

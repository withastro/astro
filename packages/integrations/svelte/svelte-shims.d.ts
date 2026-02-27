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
 * `T` (Svelte props) made safe for Astro:
 * - Normalize `children` (avoid `never`/missing cases)
 * - Widen snippet-based `children` to `any` (Astro slot/content compatibility)
 * - Strip useless `never` index signatures (allow extra keys like `client:*`)
 * - Add Astro client directives
 */
export type PropsWithClientDirectives<T> = StripNeverIndexSignatures<
	WidenChildrenIfSnippet<NormalizeNeverChildren<T>>
> &
	AstroClientDirectives;

/**
 * Wraps a Svelte component type for Astro usage.
 *
 * Creates a type that:
 * 1. Has a call signature `(_props: PropsWithClientDirectives<Props>) => any`
 *    for JSX prop resolution in `.astro` templates (used by astro check)
 * 2. Has an additional 2-parameter call signature matching Svelte's `Component`
 *    interface `(internals, props)` so the export remains assignable to
 *    `svelte.Component` for use with tools like `@testing-library/svelte`
 */
export interface AstroSvelteComponent<Props> {
	(_props: PropsWithClientDirectives<Props>): any;
	(this: void, _internals: import('svelte').ComponentInternals, _props: Props): Record<string, any>;
}

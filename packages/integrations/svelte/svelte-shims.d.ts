import 'svelte2tsx/svelte-shims-v4';

import type { JSX } from 'astro/jsx-runtime';

export type AstroClientDirectives = JSX.AstroComponentDirectives;

/**
 * Helper to detect index-signature-like keys (string or number).
 */
type IsIndexSignatureKey<K> = string extends K ? true : number extends K ? true : false;

/**
 * Removes index signatures whose value type is `never`.
 * (Keeps normal, explicitly-declared keys unchanged.)
 */
export type StripNeverIndexSignatures<T> = {
	[K in keyof T as IsIndexSignatureKey<K> extends true
		? T[K] extends never
			? never
			: K
		: K]: T[K];
};

/**
 * Svelte component props plus Astro's client directives,
 * with `never` index signatures stripped out.
 */
export type PropsWithClientDirectives<T> = StripNeverIndexSignatures<T> & AstroClientDirectives;

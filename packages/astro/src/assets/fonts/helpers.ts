import type { FontProvider } from './types.js';

export function defineFontProvider<
	TName extends string,
	TConfig extends Record<string, any> = never,
>(provider: FontProvider<TName, TConfig>) {
	return provider;
}

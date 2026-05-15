import type { FontFaceData, Provider } from 'unifont';
import type { FontResolver, Hasher, Storage } from '../definitions.js';
import type { FontProvider, ResolvedFontFamily, ResolveFontOptions } from '../types.js';
type NonEmptyProviders = [
	Provider<string, Record<string, any>>,
	...Array<Provider<string, Record<string, any>>>,
];
export declare class UnifontFontResolver implements FontResolver {
	#private;
	private constructor();
	static idFromProvider({ hasher, provider }: { hasher: Hasher; provider: FontProvider }): string;
	static astroToUnifontProvider(astroProvider: FontProvider, root: URL): Provider;
	static extractUnifontProviders({
		families,
		hasher,
		root,
	}: {
		families: Array<ResolvedFontFamily>;
		hasher: Hasher;
		root: URL;
	}): NonEmptyProviders;
	static create({
		families,
		hasher,
		storage,
		root,
	}: {
		families: Array<ResolvedFontFamily>;
		hasher: Hasher;
		storage: Storage;
		root: URL;
	}): Promise<UnifontFontResolver>;
	resolveFont({
		familyName,
		provider,
		options,
		...rest
	}: ResolveFontOptions<Record<string, any>> & {
		provider: FontProvider;
	}): Promise<Array<FontFaceData>>;
	listFonts({ provider }: { provider: FontProvider }): Promise<string[] | undefined>;
}
export {};

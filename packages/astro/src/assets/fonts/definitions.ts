import type { AstroFontProvider, ResolvedFontProvider } from './types.js';

export interface Hasher {
	hash: (input: string) => string;
}

export interface RemoteFontProviderResolver {
	resolve: (input: AstroFontProvider) => Promise<ResolvedFontProvider>;
}

export interface LocalProviderUrlResolver {
	resolve: (input: string) => string;
}

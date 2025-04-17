import type { AstroFontProvider, ResolvedFontProvider } from './types.js';

export interface Hasher {
	hashString: (input: string) => string;
	hashObject: (input: Record<string, any>) => string;
}

export interface RemoteFontProviderResolver {
	resolve: (input: AstroFontProvider) => Promise<ResolvedFontProvider>;
}

export interface LocalProviderUrlResolver {
	resolve: (input: string) => string;
}

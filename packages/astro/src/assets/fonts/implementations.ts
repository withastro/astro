import xxhash from 'xxhash-wasm';
import type { Hasher, RemoteFontProviderResolver } from './definitions.js';
import type { AstroFontProvider, ResolvedFontProvider } from './types.js';
import { resolveEntrypoint } from './utils.js';
import { validateMod } from './providers/utils.js';

export class XxHasher implements Hasher {
	private constructor(public hash: Hasher['hash']) {}

	static async create() {
		const { h64ToString } = await xxhash();
		return new XxHasher(h64ToString);
	}
}

export class BuildRemoteFontProviderResolver implements RemoteFontProviderResolver {
	constructor(public root: URL) {}

	async resolve({ entrypoint, config }: AstroFontProvider): Promise<ResolvedFontProvider> {
		const id = resolveEntrypoint(this.root, entrypoint.toString()).href;
		const mod = await import(id);
		// TODO: allow customizing thrown
		const { provider } = validateMod(mod, id);
		return { config, provider };
	}
}

export class DevServerRemoteFontProviderResolver implements RemoteFontProviderResolver {
	constructor(public root: URL) {}

	async resolve({ entrypoint, config }: AstroFontProvider): Promise<ResolvedFontProvider> {
		const id = resolveEntrypoint(this.root, entrypoint.toString()).href;
        // TODO: loadSsrModule
		const mod = await import(id);
		// TODO: allow customizing thrown
		const { provider } = validateMod(mod, id);
		return { config, provider };
	}
}

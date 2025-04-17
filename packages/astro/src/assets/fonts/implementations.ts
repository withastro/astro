import xxhash from 'xxhash-wasm';
import type {
	Hasher,
	LocalProviderUrlResolver,
	RemoteFontProviderResolver,
} from './definitions.js';
import type { AstroFontProvider, ResolvedFontProvider } from './types.js';
import { resolveEntrypoint, sortObjectByKey } from './utils.js';
import { validateMod } from './providers/utils.js';
import type { ViteDevServer } from 'vite';
import { fileURLToPath } from 'node:url';

export class XxHasher implements Hasher {
	private constructor(public hashString: Hasher['hashString']) {}

	static async create() {
		const { h64ToString } = await xxhash();
		return new XxHasher(h64ToString);
	}

	hashObject(input: Record<string, any>): string {
		// TODO: needs to be deep
		return this.hashString(JSON.stringify(sortObjectByKey(input)));
	}
}

export class BuildRemoteFontProviderResolver implements RemoteFontProviderResolver {
	constructor(private root: URL) {}

	async resolve({ entrypoint, config }: AstroFontProvider): Promise<ResolvedFontProvider> {
		const id = resolveEntrypoint(this.root, entrypoint.toString()).href;
		const mod = await import(id);
		// TODO: allow customizing thrown
		const { provider } = validateMod(mod, id);
		return { config, provider };
	}
}

export class DevServerRemoteFontProviderResolver implements RemoteFontProviderResolver {
	constructor(
		private root: URL,
		private server: ViteDevServer,
	) {}

	async resolve({ entrypoint, config }: AstroFontProvider): Promise<ResolvedFontProvider> {
		const id = resolveEntrypoint(this.root, entrypoint.toString()).href;
		const mod = await this.server.ssrLoadModule(id);
		// TODO: allow customizing thrown
		const { provider } = validateMod(mod, id);
		return { config, provider };
	}
}

export class RequireLocalProviderUrlResolver implements LocalProviderUrlResolver {
	constructor(private root: URL) {}

	resolve(input: string): string {
		return fileURLToPath(resolveEntrypoint(this.root, input));
	}
}

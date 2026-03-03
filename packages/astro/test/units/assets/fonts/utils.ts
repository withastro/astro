import type {
	Hasher,
	FontMetricsResolver,
	Storage,
	FontResolver,
	StringMatcher,
} from '../../../../dist/assets/fonts/definitions.js';
import type {
	ResolvedFontFamily,
	ResolveFontOptions,
} from '../../../../dist/assets/fonts/types.js';
import type { FontProvider } from '../../../../dist/index.js';

export class SpyStorage implements Storage {
	#store = new Map<string, any>();

	get store() {
		return this.#store;
	}

	async getItem(key: string) {
		return this.#store.get(key) ?? null;
	}

	async getItemRaw(key: string) {
		return this.#store.get(key) ?? null;
	}

	async setItemRaw(key: string, value: any) {
		this.#store.set(key, value);
	}

	async setItem(key: string, value: any) {
		this.#store.set(key, value);
	}
}

export class FakeHasher implements Hasher {
	#value: string | undefined;

	constructor(value?: string) {
		this.#value = value;
	}

	hashString(input: string) {
		return this.#value ?? input;
	}

	hashObject(input: any) {
		return this.#value ?? JSON.stringify(input);
	}
}

export class FakeFontMetricsResolver implements FontMetricsResolver {
	async getMetrics() {
		return {
			ascent: 0,
			descent: 0,
			lineGap: 0,
			unitsPerEm: 0,
			xWidthAvg: 0,
		};
	}

	generateFontFace(input: Parameters<FontMetricsResolver['generateFontFace']>[0]) {
		return JSON.stringify(input, null, 2) + `,`;
	}
}

export function markdownBold(input: string) {
	return `**${input}**`;
}

/** @implements {FontResolver} */
export class PassthroughFontResolver implements FontResolver {
	#providers: Map<string, FontProvider<Record<string, any>>>;

	private constructor(providers: Map<string, FontProvider<Record<string, any>>>) {
		this.#providers = providers;
	}

	static async create({
		families,
		hasher,
	}: {
		families: Array<ResolvedFontFamily>;
		hasher: Hasher;
	}) {
		const providers = new Map<string, FontProvider<Record<string, any>>>();
		for (const { provider } of families) {
			provider.name = `${provider.name}-${hasher.hashObject(provider.config ?? {})}`;
			providers.set(provider.name, provider as any);
		}
		const storage = new SpyStorage();
		await Promise.all(
			Array.from(providers.values()).map(async (provider) => {
				await provider.init?.({ storage, root: new URL(import.meta.url) });
			}),
		);
		return new PassthroughFontResolver(providers);
	}

	async resolveFont({
		provider,
		...rest
	}: ResolveFontOptions<Record<string, any>> & { provider: FontProvider }) {
		const res = await this.#providers.get(provider.name)?.resolveFont(rest);
		return res?.fonts ?? [];
	}

	async listFonts({ provider }: { provider: FontProvider }) {
		return await this.#providers.get(provider.name)?.listFonts?.();
	}
}

export class FakeStringMatcher implements StringMatcher {
	#match: string;

	constructor(match: string) {
		this.#match = match;
	}

	getClosestMatch() {
		return this.#match;
	}
}

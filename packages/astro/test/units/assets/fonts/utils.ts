import type {
	FontMetricsResolver,
	FontResolver,
	Hasher,
	Storage,
	StringMatcher,
} from '../../../../dist/assets/fonts/definitions.js';
import type {
	FontProvider,
	ResolvedFontFamily,
	ResolveFontOptions,
	FontFaceMetrics,
	CssProperties,
} from '../../../../dist/assets/fonts/types.js';

export class SpyStorage implements Storage {
	#store = new Map<string, unknown>();

	get store() {
		return this.#store;
	}

	async getItem(key: string): Promise<unknown | null> {
		return this.#store.get(key) ?? null;
	}

	async getItemRaw(key: string): Promise<Buffer | null> {
		return (this.#store.get(key) as Buffer) ?? null;
	}

	async setItemRaw(key: string, value: Buffer): Promise<void> {
		this.#store.set(key, value);
	}

	async setItem(key: string, value: unknown): Promise<void> {
		this.#store.set(key, value);
	}
}

export class FakeHasher implements Hasher {
	#value: string | undefined;

	constructor(value?: string) {
		this.#value = value;
	}

	hashString(input: string): string {
		return this.#value ?? input;
	}

	hashObject(input: Record<string, unknown>): string {
		return this.#value ?? JSON.stringify(input);
	}
}

export class FakeFontMetricsResolver implements FontMetricsResolver {
	async getMetrics(): Promise<FontFaceMetrics> {
		return {
			ascent: 0,
			descent: 0,
			lineGap: 0,
			unitsPerEm: 0,
			xWidthAvg: 0,
		};
	}

	generateFontFace(input: {
		metrics: FontFaceMetrics;
		fallbackMetrics: FontFaceMetrics;
		name: string;
		font: string;
		properties: CssProperties;
	}): string {
		return JSON.stringify(input, null, 2) + `,`;
	}
}

export function markdownBold(input: string): string {
	return `**${input}**`;
}

export class PassthroughFontResolver implements FontResolver {
	#providers: Map<string, FontProvider<Record<string, unknown>>>;

	private constructor(providers: Map<string, FontProvider<Record<string, unknown>>>) {
		this.#providers = providers;
	}

	static async create({
		families,
		hasher,
	}: {
		families: Array<ResolvedFontFamily>;
		hasher: Hasher;
	}): Promise<PassthroughFontResolver> {
		const providers = new Map<string, FontProvider<Record<string, unknown>>>();
		for (const { provider } of families) {
			provider.name = `${provider.name}-${hasher.hashObject((provider.config ?? {}) as Record<string, unknown>)}`;
			providers.set(provider.name, provider as FontProvider<Record<string, unknown>>);
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
	}: ResolveFontOptions<Record<string, unknown>> & {
		provider: FontProvider;
	}): Promise<Array<import('unifont').FontFaceData>> {
		const res = await this.#providers.get(provider.name)?.resolveFont(rest);
		return res?.fonts ?? [];
	}

	async listFonts({ provider }: { provider: FontProvider }): Promise<string[] | undefined> {
		return await this.#providers.get(provider.name)?.listFonts?.();
	}
}

export class FakeStringMatcher implements StringMatcher {
	#match: string;

	constructor(match: string) {
		this.#match = match;
	}

	getClosestMatch(): string {
		return this.#match;
	}
}

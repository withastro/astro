import type { FontFaceData, Provider } from 'unifont';
import { createUnifont, defineFontProvider, type Unifont } from 'unifont';
import type { FontResolver, Hasher, Storage } from '../definitions.js';
import type { FontProvider, ResolvedFontFamily, ResolveFontOptions } from '../types.js';

type NonEmptyProviders = [
	Provider<string, Record<string, any>>,
	...Array<Provider<string, Record<string, any>>>,
];

export class UnifontFontResolver implements FontResolver {
	readonly #unifont: Unifont<NonEmptyProviders>;
	readonly #hasher: Hasher;

	private constructor({
		unifont,
		hasher,
	}: { unifont: Unifont<NonEmptyProviders>; hasher: Hasher }) {
		this.#unifont = unifont;
		this.#hasher = hasher;
	}

	static idFromProvider({ hasher, provider }: { hasher: Hasher; provider: FontProvider }): string {
		const hash = hasher.hashObject({
			name: provider.name,
			...provider.config,
		});
		return `${provider.name}-${hash}`;
	}

	static astroToUnifontProvider(astroProvider: FontProvider, root: URL): Provider {
		return defineFontProvider(astroProvider.name, async (_options: any, ctx) => {
			await astroProvider?.init?.({ ...ctx, root });
			return {
				async resolveFont(familyName, { options, ...rest }) {
					return await astroProvider.resolveFont({ familyName, options, ...rest });
				},
				async listFonts() {
					return astroProvider.listFonts?.();
				},
			};
		})(astroProvider.config);
	}

	static extractUnifontProviders({
		families,
		hasher,
		root,
	}: {
		families: Array<ResolvedFontFamily>;
		hasher: Hasher;
		root: URL;
	}) {
		const providers = new Map<string, Provider>();

		for (const { provider } of families) {
			const id = this.idFromProvider({ hasher, provider });

			if (!providers.has(id)) {
				const unifontProvider = this.astroToUnifontProvider(provider, root);
				// Makes sure every font uses the right instance of a given provider
				// if this provider is provided several times with different options
				// We have to mutate the unifont provider name because unifont deduplicates
				// based on the name.
				unifontProvider._name = this.idFromProvider({ hasher, provider });
				providers.set(id, unifontProvider);
			}
		}

		return Array.from(providers.values()) as NonEmptyProviders;
	}

	static async create({
		families,
		hasher,
		storage,
		root,
	}: {
		families: Array<ResolvedFontFamily>;
		hasher: Hasher;
		storage: Storage;
		root: URL;
	}) {
		return new UnifontFontResolver({
			unifont: await createUnifont(this.extractUnifontProviders({ families, hasher, root }), {
				storage,
				// TODO: consider enabling, would require new astro errors
				throwOnError: false,
			}),
			hasher,
		});
	}

	async resolveFont({
		familyName,
		provider,
		options,
		...rest
	}: ResolveFontOptions<Record<string, any>> & { provider: FontProvider }): Promise<
		Array<FontFaceData>
	> {
		const id = UnifontFontResolver.idFromProvider({
			hasher: this.#hasher,
			provider,
		});
		const { fonts } = await this.#unifont.resolveFont(
			familyName,
			{
				// Options are currently namespaced by provider name, it may change in
				// https://github.com/unjs/unifont/pull/287
				options: {
					[id]: options,
				},
				...rest,
			},
			[id],
		);
		return fonts;
	}

	async listFonts({ provider }: { provider: FontProvider }): Promise<string[] | undefined> {
		return await this.#unifont.listFonts([
			UnifontFontResolver.idFromProvider({
				hasher: this.#hasher,
				provider,
			}),
		]);
	}
}

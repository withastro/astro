import type { FontFaceData, Provider } from 'unifont';
import { createUnifont, type Unifont } from 'unifont';
import { LOCAL_PROVIDER_NAME } from '../constants.js';
import type { FontResolver, Hasher, Storage } from '../definitions.js';
import type {
	AstroFontProvider,
	AstroFontProviderResolveFontOptions,
	ResolvedFontFamily,
} from '../types.js';

type ProviderFn = Provider extends (ctx: infer C) => infer R ? (ctx: C) => R : never;

export class UnifontFontResolver implements FontResolver {
	readonly #unifont: Unifont;

	private constructor({ unifont }: { unifont: Unifont }) {
		this.#unifont = unifont;
	}

	static #astroToUnifontProvider(astroProvider: AstroFontProvider): Provider {
		return Object.assign(
			(async (ctx) => {
				await astroProvider.init(ctx);
				return {
					async resolveFont(familyName, options) {
						return await astroProvider.resolveFont({
							familyName,
							...options,
						});
					},
					async listFonts() {
						return undefined;
					},
				};
			}) satisfies ProviderFn,
			{ _name: astroProvider.name },
		);
	}

	static #extractUnifontProviders({
		families,
		hasher,
	}: {
		families: Array<ResolvedFontFamily>;
		hasher: Hasher;
	}) {
		const hashes = new Set<string>();
		const providers: Array<Provider> = [];

		for (const { provider } of families) {
			// The local provider logic happens outside of unifont
			if (provider === LOCAL_PROVIDER_NAME) {
				continue;
			}

			const unifontProvider = this.#astroToUnifontProvider(provider);
			const hash = hasher.hashObject({
				name: unifontProvider._name,
				...provider.options,
			});
			// Makes sure every font uses the right instance of a given provider
			// if this provider is provided several times with different options
			// We have to mutate the unifont provider name because unifont deduplicates
			// based on the name.
			unifontProvider._name += `-${hash}`;
			// We set the provider name so we can tell unifont what provider to use when
			// resolving font faces
			// TODO: mutating is confusing. There must be a better pattern than this
			provider.name = unifontProvider._name;

			if (!hashes.has(hash)) {
				hashes.add(hash);
				providers.push(unifontProvider);
			}
		}

		return providers;
	}

	static async create({
		families,
		hasher,
		storage,
	}: {
		families: Array<ResolvedFontFamily>;
		hasher: Hasher;
		storage: Storage;
	}) {
		return new UnifontFontResolver({
			unifont: await createUnifont(this.#extractUnifontProviders({ families, hasher }), {
				storage,
			}),
		});
	}

	async resolveFont({
		familyName,
		provider,
		...rest
	}: AstroFontProviderResolveFontOptions & { provider: string }): Promise<Array<FontFaceData>> {
		const { fonts } = await this.#unifont.resolveFont(familyName, rest, [provider]);
		return fonts;
	}

	async listFonts({ provider }: { provider: string }): Promise<string[] | undefined> {
		return await this.#unifont.listFonts([provider]);
	}
}

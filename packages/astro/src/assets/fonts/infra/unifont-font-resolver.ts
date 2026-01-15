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

	private constructor({ unifont }: { unifont: Unifont<NonEmptyProviders> }) {
		this.#unifont = unifont;
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
		const hashes = new Set<string>();
		const providers: Array<Provider> = [];

		for (const { provider } of families) {
			const unifontProvider = this.astroToUnifontProvider(provider, root);
			const hash = hasher.hashObject({
				name: unifontProvider._name,
				...provider.config,
			});
			// Makes sure every font uses the right instance of a given provider
			// if this provider is provided several times with different options
			// We have to mutate the unifont provider name because unifont deduplicates
			// based on the name.
			unifontProvider._name += `-${hash}`;
			// We set the provider name so we can tell unifont what provider to use when
			// resolving font faces
			// TODO: mutating is confusing. Instead, keep an internal record of providers
			// Also update PassthroughFontResolver to use the same kind of pattern
			provider.name = unifontProvider._name;

			if (!hashes.has(hash)) {
				hashes.add(hash);
				providers.push(unifontProvider);
			}
		}

		return providers as NonEmptyProviders;
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
		});
	}

	async resolveFont({
		familyName,
		provider,
		options,
		...rest
	}: ResolveFontOptions<Record<string, any>> & { provider: string }): Promise<Array<FontFaceData>> {
		const { fonts } = await this.#unifont.resolveFont(
			familyName,
			{
				// Options are currently namespaced by provider name, it may change in
				// https://github.com/unjs/unifont/pull/287
				options: {
					[provider]: options,
				},
				...rest,
			},
			[provider],
		);
		return fonts;
	}

	async listFonts({ provider }: { provider: string }): Promise<string[] | undefined> {
		return await this.#unifont.listFonts([provider]);
	}
}

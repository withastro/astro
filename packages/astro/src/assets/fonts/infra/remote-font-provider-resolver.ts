import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import type { RemoteFontProviderModResolver, RemoteFontProviderResolver } from '../definitions.js';
import type { AstroFontProvider, ResolvedFontProvider } from '../types.js';
import { resolveEntrypoint } from '../utils.js';

// TODO: find better name
export class RealRemoteFontProviderResolver implements RemoteFontProviderResolver {
	readonly #root: URL;
	readonly #modResolver: RemoteFontProviderModResolver;

	constructor({
		root,
		modResolver,
	}: {
		root: URL;
		modResolver: RemoteFontProviderModResolver;
	}) {
		this.#root = root;
		this.#modResolver = modResolver;
	}

	#validateMod({
		mod,
		entrypoint,
	}: {
		mod: any;
		entrypoint: string;
	}): Pick<ResolvedFontProvider, 'provider'> {
		// We do not throw astro errors directly to avoid duplication. Instead, we throw an error to be used as cause
		try {
			if (typeof mod !== 'object' || mod === null) {
				throw new Error(`Expected an object for the module, but received ${typeof mod}.`);
			}

			if (typeof mod.provider !== 'function') {
				throw new Error(`Invalid provider export in module, expected a function.`);
			}

			return {
				provider: mod.provider,
			};
		} catch (cause) {
			throw new AstroError(
				{
					...AstroErrorData.CannotLoadFontProvider,
					message: AstroErrorData.CannotLoadFontProvider.message(entrypoint),
				},
				{ cause },
			);
		}
	}

	async resolve({ entrypoint, config }: AstroFontProvider): Promise<ResolvedFontProvider> {
		const id = resolveEntrypoint(this.#root, entrypoint.toString()).href;
		const mod = await this.#modResolver.resolve(id);
		const { provider } = this.#validateMod({
			mod,
			entrypoint: id,
		});
		return { config, provider };
	}
}

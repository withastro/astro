import type {
	ErrorHandler,
	RemoteFontProviderModResolver,
	RemoteFontProviderResolver,
} from '../definitions.js';
import type { AstroFontProvider, ResolvedFontProvider } from '../types.js';
import { resolveEntrypoint } from '../utils.js';

export function validateMod({
	mod,
	entrypoint,
	errorHandler,
}: { mod: any; entrypoint: string; errorHandler: ErrorHandler }): Pick<
	ResolvedFontProvider,
	'provider'
> {
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
		throw errorHandler.handle({
			type: 'cannot-load-font-provider',
			data: {
				entrypoint,
			},
			cause,
		});
	}
}

export class RealRemoteFontProviderResolver implements RemoteFontProviderResolver {
	constructor(
		private root: URL,
		private errorHandler: ErrorHandler,
	) {}

	async resolve({
		provider: { entrypoint, config },
		modResolver,
	}: {
		provider: AstroFontProvider;
		modResolver: RemoteFontProviderModResolver;
	}): Promise<ResolvedFontProvider> {
		const id = resolveEntrypoint(this.root, entrypoint.toString()).href;
		const mod = await modResolver.resolve(id);
		const { provider } = validateMod({
			mod,
			entrypoint: id,
			errorHandler: this.errorHandler,
		});
		return { config, provider };
	}
}

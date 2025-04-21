import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import type { AstroFontProvider, ResolvedFontProvider } from '../types.js';
import { resolveEntrypoint } from '../utils.js';

export function validateMod(mod: any, entrypoint: string): Pick<ResolvedFontProvider, 'provider'> {
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

export type ResolveMod = (id: string) => Promise<any>;

export interface ResolveProviderOptions {
	root: URL;
	provider: AstroFontProvider;
	resolveMod: ResolveMod;
}

export async function resolveProvider({
	root,
	provider: { entrypoint, config },
	resolveMod,
}: ResolveProviderOptions): Promise<ResolvedFontProvider> {
	const id = resolveEntrypoint(root, entrypoint.toString()).href;
	const mod = await resolveMod(id);
	const { provider } = validateMod(mod, id);
	return { config, provider };
}

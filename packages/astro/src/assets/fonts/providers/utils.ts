import { createRequire } from 'node:module';
import type { FontProvider, ResolvedFontProvider } from '../types.js';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AstroError, AstroErrorData } from '../../../core/errors/index.js';

export function resolveEntrypoint(root: URL, entrypoint: string): string {
	const require = createRequire(root);

	try {
		return require.resolve(entrypoint);
	} catch {
		return fileURLToPath(new URL(entrypoint, root));
	}
}

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
	provider: FontProvider;
	resolveMod: ResolveMod;
}

export async function resolveProvider({
	root,
	provider: { entrypoint, config },
	resolveMod,
}: ResolveProviderOptions): Promise<ResolvedFontProvider> {
	const id = pathToFileURL(resolveEntrypoint(root, entrypoint.toString())).href;
	const mod = await resolveMod(id);
	const { provider } = validateMod(mod, id);
	return { config, provider };
}

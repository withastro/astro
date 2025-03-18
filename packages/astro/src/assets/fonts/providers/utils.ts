import { createRequire } from 'node:module';
import { google } from './google.js';
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

export function validateMod(
	mod: any,
	providerName: string,
): Pick<ResolvedFontProvider, 'provider'> {
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
				message: AstroErrorData.CannotLoadFontProvider.message(providerName),
			},
			{ cause },
		);
	}
}

export type ResolveMod = (id: string) => Promise<any>;

export async function resolveProviders({
	root,
	providers: _providers,
	resolveMod,
}: {
	root: URL;
	providers: Array<FontProvider<any>>;
	resolveMod: ResolveMod;
}): Promise<Array<ResolvedFontProvider>> {
	const providers = [google(), ..._providers];
	const resolvedProviders: Array<ResolvedFontProvider> = [];

	for (const { name, entrypoint, config } of providers) {
		const id = pathToFileURL(resolveEntrypoint(root, entrypoint.toString())).href;
		const mod = await resolveMod(id);
		const { provider } = validateMod(mod, name);
		resolvedProviders.push({ name, config, provider });
	}

	return resolvedProviders;
}

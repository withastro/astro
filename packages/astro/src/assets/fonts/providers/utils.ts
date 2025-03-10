import { createRequire } from 'node:module';
import { google } from './google.js';
import type { FontProvider, ResolvedFontProvider } from '../types.js';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function resolveEntrypoint(root: URL, entrypoint: string): string {
	const require = createRequire(root);

	try {
		return require.resolve(entrypoint);
	} catch {
		return fileURLToPath(new URL(entrypoint, root));
	}
}

export function validateMod(mod: any): Pick<ResolvedFontProvider, 'provider'> {
	try {
		if (!mod.provider && typeof mod.provider !== 'function') {
			// TODO: improve
			throw new Error('Not a function');
		}
		return {
			provider: mod.provider,
		};
	} catch (e) {
		// TODO: AstroError
		throw e;
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
		const { provider } = validateMod(mod);
		resolvedProviders.push({ name, config, provider });
	}

	return resolvedProviders;
}

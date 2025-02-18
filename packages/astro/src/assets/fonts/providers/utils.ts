import { createRequire } from 'node:module';
import type { AstroSettings } from '../../../types/astro.js';
import { google } from './google.js';
import type { FontProvider, ResolvedFontProvider } from '../types.js';
import { fileURLToPath } from 'node:url';

function resolveEntrypoint(settings: AstroSettings, entrypoint: string): string {
	const require = createRequire(settings.config.root);

	try {
		return require.resolve(entrypoint);
	} catch {
		return fileURLToPath(new URL(entrypoint, settings.config.root));
	}
}

function validateMod(mod: any): Pick<ResolvedFontProvider, 'provider'> {
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
	settings,
	providers: _providers,
	resolveMod,
}: {
	settings: AstroSettings;
	providers: Array<FontProvider<any>>;
	resolveMod: ResolveMod;
}): Promise<Array<ResolvedFontProvider>> {
	const providers = [google(), ..._providers];
	const resolvedProviders: Array<ResolvedFontProvider> = [];

	for (const { name, entrypoint, config } of providers) {
		const id = resolveEntrypoint(settings, entrypoint.toString());
		const mod = await resolveMod(id);
		const { provider } = validateMod(mod);
		resolvedProviders.push({ name, config, provider });
	}

	return resolvedProviders;
}

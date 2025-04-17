import type { ErrorHandler, RemoteFontProviderResolver } from '../definitions.js';
import type { AstroFontProvider, ResolvedFontProvider } from '../types.js';
import { resolveEntrypoint } from '../utils.js';
import type { ViteDevServer } from 'vite';

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

export async function resolve({
	provider: { entrypoint, config },
	resolveMod,
	root,
	errorHandler,
}: {
	provider: AstroFontProvider;
	resolveMod: (id: string) => Promise<any>;
	root: URL;
	errorHandler: ErrorHandler;
}): Promise<ResolvedFontProvider> {
	const id = resolveEntrypoint(root, entrypoint.toString()).href;
	const mod = await resolveMod(id);
	const { provider } = validateMod({
		mod,
		entrypoint: id,
		errorHandler,
	});
	return { config, provider };
}

export class BuildRemoteFontProviderResolver implements RemoteFontProviderResolver {
	constructor(
		private root: URL,
		private errorHandler: ErrorHandler,
	) {}

	async resolve(provider: AstroFontProvider): Promise<ResolvedFontProvider> {
		return await resolve({
			provider,
			resolveMod: (id) => import(id),
			root: this.root,
			errorHandler: this.errorHandler,
		});
	}
}

export class DevServerRemoteFontProviderResolver implements RemoteFontProviderResolver {
	constructor(
		private root: URL,
		private server: ViteDevServer,
		private errorHandler: ErrorHandler,
	) {}

	async resolve(provider: AstroFontProvider): Promise<ResolvedFontProvider> {
		return await resolve({
			provider,
			resolveMod: (id) => this.server.ssrLoadModule(id),
			root: this.root,
			errorHandler: this.errorHandler,
		});
	}
}

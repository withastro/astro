import type { AstroRenderer, AstroSettings, SSRLoadedRenderer } from '../../@types/astro';
import type { ModuleLoader } from '../module-loader/index.js';

export async function loadRenderers(
	settings: AstroSettings,
	moduleLoader: ModuleLoader
): Promise<SSRLoadedRenderer[]> {
	const renderers = await Promise.all(settings.renderers.map((r) => loadRenderer(r, moduleLoader)));
	return renderers.filter(Boolean) as SSRLoadedRenderer[];
}

export async function loadRenderer(
	renderer: AstroRenderer,
	moduleLoader: ModuleLoader
): Promise<SSRLoadedRenderer | undefined> {
	const mod = await moduleLoader.import(renderer.serverEntrypoint);
	if (typeof mod.default !== 'undefined') {
		return {
			...renderer,
			ssr: mod.default,
		};
	}
	return undefined;
}

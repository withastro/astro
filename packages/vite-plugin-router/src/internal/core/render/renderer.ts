import type { AstroRenderer } from '@astrojs/vite-plugin-astro';
import type { SSRLoadedRenderer } from '@astrojs/vite-plugin-astro';
import type { ModuleLoader } from '../module-loader/index.js';

export async function loadRenderer(
	renderer: AstroRenderer,
	moduleLoader: ModuleLoader,
): Promise<SSRLoadedRenderer | undefined> {
	const mod = await moduleLoader.import(renderer.serverEntrypoint.toString());
	if (typeof mod.default !== 'undefined') {
		return {
			...renderer,
			ssr: mod.default,
		};
	}
	return undefined;
}

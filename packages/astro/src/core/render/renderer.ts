import type { AstroRenderer, SSRLoadedRenderer } from '../../@types/astro.js';
import type { ModuleLoader } from '../module-loader/index.js';

export async function loadRenderer(
	renderer: AstroRenderer,
	moduleLoader: ModuleLoader,
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

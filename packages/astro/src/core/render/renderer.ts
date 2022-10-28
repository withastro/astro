import type { AstroRenderer, SSRLoadedRenderer } from '../../@types/astro';

export type RendererServerEntrypointModule = {
	default: SSRLoadedRenderer['ssr'];
};
export type MaybeRendererServerEntrypointModule = Partial<RendererServerEntrypointModule>;
export type RendererLoader = (entryPoint: string) => Promise<MaybeRendererServerEntrypointModule>;

export async function loadRenderer(
	renderer: AstroRenderer,
	loader: RendererLoader
): Promise<SSRLoadedRenderer | undefined> {
	const mod = await loader(renderer.serverEntrypoint);
	if (typeof mod.default !== 'undefined') {
		return createLoadedRenderer(renderer, mod as RendererServerEntrypointModule);
	}
	return undefined;
}

export function filterFoundRenderers(
	renderers: Array<SSRLoadedRenderer | undefined>
): SSRLoadedRenderer[] {
	return renderers.filter((renderer): renderer is SSRLoadedRenderer => {
		return !!renderer;
	});
}

export function createLoadedRenderer(
	renderer: AstroRenderer,
	mod: RendererServerEntrypointModule
): SSRLoadedRenderer {
	return {
		...renderer,
		ssr: mod.default,
	};
}

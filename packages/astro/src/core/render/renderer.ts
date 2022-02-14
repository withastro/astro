import type { Renderer } from '../../@types/astro';

import npath from 'path';

interface RendererResolverImplementation {
	renderer: (name: string) => Promise<any>;
	server: (entry: string) => Promise<any>;
}

export async function createRenderer(renderer: string, impl: RendererResolverImplementation) {
	const resolvedRenderer: any = {};
	// We can dynamically import the renderer by itself because it shouldn't have
	// any non-standard imports, the index is just meta info.
	// The other entrypoints need to be loaded through Vite.
	const {
		default: { name, client, polyfills, hydrationPolyfills, server },
	} = await impl.renderer(renderer); //await import(resolveDependency(renderer, astroConfig));

	resolvedRenderer.name = name;
	if (client) resolvedRenderer.source = npath.posix.join(renderer, client);
	resolvedRenderer.serverEntry = npath.posix.join(renderer, server);
	if (Array.isArray(hydrationPolyfills)) resolvedRenderer.hydrationPolyfills = hydrationPolyfills.map((src: string) => npath.posix.join(renderer, src));
	if (Array.isArray(polyfills)) resolvedRenderer.polyfills = polyfills.map((src: string) => npath.posix.join(renderer, src));

	const { default: rendererSSR } = await impl.server(resolvedRenderer.serverEntry);
	resolvedRenderer.ssr = rendererSSR;

	const completedRenderer: Renderer = resolvedRenderer;
	return completedRenderer;
}

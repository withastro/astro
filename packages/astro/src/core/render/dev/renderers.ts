import type * as vite from 'vite';
import type { AstroConfig, Renderer } from '../../../@types/astro';

import { resolveDependency } from '../../util.js';
import { createRenderer } from '../renderer.js';

const cache = new Map<string, Promise<Renderer>>();

async function resolveRenderer(viteServer: vite.ViteDevServer, renderer: string, astroConfig: AstroConfig): Promise<Renderer> {
	const resolvedRenderer: Renderer = await createRenderer(renderer, {
		renderer(name) {
			return import(resolveDependency(name, astroConfig));
		},
		async server(entry) {
			const { url } = await viteServer.moduleGraph.ensureEntryFromUrl(entry);
			const mod = await viteServer.ssrLoadModule(url);
			return mod;
		},
	});

	return resolvedRenderer;
}

export async function resolveRenderers(viteServer: vite.ViteDevServer, astroConfig: AstroConfig): Promise<Renderer[]> {
	const ids: string[] = astroConfig.renderers;
	const renderers = await Promise.all(
		ids.map((renderer) => {
			if (cache.has(renderer)) return cache.get(renderer)!;
			let promise = resolveRenderer(viteServer, renderer, astroConfig);
			cache.set(renderer, promise);
			return promise;
		})
	);

	return renderers;
}

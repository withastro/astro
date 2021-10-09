import type { ViteDevServer } from 'vite';

import path from 'path';

// resolution cache
const cache = new Map();

/** Initialize Astro renderers */
export async function initRenderers(viteServer: ViteDevServer, ids: string[]) {
  const renderers = await Promise.all(
    ids.map(async (renderer) => {
      if (cache.has(renderer)) return cache.get(renderer);

      const resolvedRenderer: any = {};
      // We can dynamically import the renderer by itself because it shouldn't have
      // any non-standard imports, the index is just meta info.
      // The other entrypoints need to be loaded through Vite.
      const {
        default: { name, client, polyfills, hydrationPolyfills, server },
      } = await import(renderer);

      resolvedRenderer.name = name;
      if (client) resolvedRenderer.source = path.posix.join(renderer, client);
      if (Array.isArray(hydrationPolyfills)) resolvedRenderer.hydrationPolyfills = hydrationPolyfills.map((src: string) => path.posix.join(renderer, src));
      if (Array.isArray(polyfills)) resolvedRenderer.polyfills = polyfills.map((src: string) => path.posix.join(renderer, src));
      const { url } = await viteServer.moduleGraph.ensureEntryFromUrl(path.posix.join(renderer, server));
      const { default: rendererSSR } = await viteServer.ssrLoadModule(url);
      resolvedRenderer.ssr = rendererSSR;

      cache.set(renderer, resolvedRenderer);
      return resolvedRenderer;
    })
  );

  return renderers;
}

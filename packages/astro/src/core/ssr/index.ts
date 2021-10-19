import type { BuildResult } from 'esbuild';
import type { ViteDevServer } from '../vite';
import type { AstroConfig, ComponentInstance, GetStaticPathsResult, Params, Props, Renderer, RouteCache, RouteData, RuntimeMode, SSRError } from '../../@types/astro-core';
import type { AstroGlobal, TopLevelAstro, SSRResult } from '../../@types/astro-runtime';
import type { LogOptions } from '../logger';

import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { renderPage, renderSlot } from '../../runtime/server/index.js';
import { canonicalURL as getCanonicalURL, codeFrame } from '../util.js';
import { generatePaginateFunction } from './paginate.js';
import { getParams, validateGetStaticPathsModule, validateGetStaticPathsResult } from './routing.js';

interface SSROptions {
  /** an instance of the AstroConfig */
  astroConfig: AstroConfig;
  /** location of file on disk */
  filePath: URL;
  /** logging options */
  logging: LogOptions;
  /** "development" or "production" */
  mode: RuntimeMode;
  /** production website, needed for some RSS & Sitemap functions */
  origin: string;
  /** the web request (needed for dynamic routes) */
  pathname: string;
  /** optional, in case we need to render something outside of a dev server */
  route?: RouteData;
  /** pass in route cache because SSR can’t manage cache-busting */
  routeCache: RouteCache;
  /** Vite instance */
  viteServer: ViteDevServer;
}

const cache = new Map<string, Promise<Renderer>>();

// TODO: improve validation and error handling here.
async function resolveRenderer(viteServer: ViteDevServer, renderer: string) {
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

  const completedRenderer: Renderer = resolvedRenderer;
  return completedRenderer;
}

async function resolveRenderers(viteServer: ViteDevServer, ids: string[]): Promise<Renderer[]> {
  const renderers = await Promise.all(
    ids.map((renderer) => {
      if (cache.has(renderer)) return cache.get(renderer)!;
      let promise = resolveRenderer(viteServer, renderer);
      cache.set(renderer, promise);
      return promise;
    })
  );

  return renderers;
}

/** use Vite to SSR */
export async function ssr({ astroConfig, filePath, logging, mode, origin, pathname, route, routeCache, viteServer }: SSROptions): Promise<string> {
  try {
    // 1. resolve renderers
    // Important this happens before load module in case a renderer provides polyfills.
    const renderers = await resolveRenderers(viteServer, astroConfig.renderers);

    // 1.5. load module
    const mod = (await viteServer.ssrLoadModule(fileURLToPath(filePath))) as ComponentInstance;

    // 2. handle dynamic routes
    let params: Params = {};
    let pageProps: Props = {};
    if (route && !route.pathname) {
      if (route.params.length) {
        const paramsMatch = route.pattern.exec(pathname);
        if (paramsMatch) {
          params = getParams(route.params)(paramsMatch);
        }
      }
      validateGetStaticPathsModule(mod);
      routeCache[route.component] =
        routeCache[route.component] ||
        (
          await mod.getStaticPaths!({
            paginate: generatePaginateFunction(route),
            rss: () => {
              /* noop */
            },
          })
        ).flat();
      validateGetStaticPathsResult(routeCache[route.component], logging);
      const routePathParams: GetStaticPathsResult = routeCache[route.component];
      const matchedStaticPath = routePathParams.find(({ params: _params }) => JSON.stringify(_params) === JSON.stringify(params));
      if (!matchedStaticPath) {
        throw new Error(`[getStaticPaths] route pattern matched, but no matching static path found. (${pathname})`);
      }
      pageProps = { ...matchedStaticPath.props } || {};
    }

    // 3. render page
    const Component = await mod.default;
    if (!Component) throw new Error(`Expected an exported Astro component but received typeof ${typeof Component}`);

    if (!Component.isAstroComponentFactory) throw new Error(`Unable to SSR non-Astro component (${route?.component})`);

    const result: SSRResult = {
      styles: new Set(),
      scripts: new Set(),
      /** This function returns the `Astro` faux-global */
      createAstro(astroGlobal: TopLevelAstro, props: Record<string, any>, slots: Record<string, any> | null) {
        const site = new URL(origin);
        const url = new URL('.' + pathname, site);
        const canonicalURL = getCanonicalURL('.' + pathname, astroConfig.buildOptions.site || origin);

        return {
          __proto__: astroGlobal,
          props,
          request: {
            canonicalURL,
            params: {},
            url,
          },
          slots: Object.fromEntries(Object.entries(slots || {}).map(([slotName]) => [slotName, true])),
          privateRenderSlotDoNotUse(slotName: string) {
            return renderSlot(result, slots ? slots[slotName] : null);
          },
        } as unknown as AstroGlobal;
      },
      _metadata: { renderers },
    };

    let html = await renderPage(result, Component, pageProps, null);

    // 4. modify response
    if (mode === 'development') {
      html = await viteServer.transformIndexHtml(fileURLToPath(filePath), html, pathname);
    }

    // 5. finish
    return html;
  } catch (e: any) {
    viteServer.ssrFixStacktrace(e);
    // Astro error (thrown by esbuild so it needs to be formatted for Vite)
    if (e.errors) {
      const { location, pluginName, text } = (e as BuildResult).errors[0];
      const err = new Error(text) as SSRError;
      if (location) err.loc = { file: location.file, line: location.line, column: location.column };
      const frame = codeFrame(await fs.promises.readFile(filePath, 'utf8'), err.loc);
      err.frame = frame;
      err.id = location?.file;
      err.message = `${location?.file}: ${text}

${frame}
`;
      err.stack = e.stack;
      if (pluginName) err.plugin = pluginName;
      throw err;
    }

    // Vite error (already formatted)
    throw e;
  }
}

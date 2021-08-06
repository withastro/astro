import cheerio from 'cheerio';
import * as eslexer from 'es-module-lexer';
import type { ViteDevServer } from 'vite';
import type { ComponentInstance, GetStaticPathsResult, Params, Props, RouteCache, RouteData, RuntimeMode } from '../@types/astro';
import type { LogOptions } from '../logger';

import { fileURLToPath } from 'url';
import { generatePaginateFunction } from './paginate.js';
import { getParams, validateGetStaticPathsModule, validateGetStaticPathsResult } from './routing.js';
import { canonicalURL, parseNpmName } from './util.js';

interface SSROptions {
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

// note: not every request has a Vite browserHash. if we ever receive one, hang onto it
// this prevents client-side errors such as the "double React bug" (https://reactjs.org/warnings/invalid-hook-call-warning.html#mismatching-versions-of-react-and-react-dom)
let browserHash: string | undefined;

/** use Vite to SSR */
export async function ssr({ filePath, logging, mode, origin, pathname, route, routeCache, viteServer }: SSROptions): Promise<string> {
  // 1. load module
  const mod = (await viteServer.ssrLoadModule(fileURLToPath(filePath))) as ComponentInstance;

  // 2. handle dynamic routes
  let params: Params = {};
  let pageProps: Props = {};
  if (route && !route.pathname) {
    if (route.params.length) {
      const paramsMatch = route.pattern.exec(pathname)!;
      params = getParams(route.params)(paramsMatch);
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
  if (!browserHash && (viteServer as any)._optimizeDepsMetadata?.browserHash) browserHash = (viteServer as any)._optimizeDepsMetadata.browserHash; // note: this is "private" and may change over time
  const fullURL = new URL(pathname, origin);
  if (!mod.__renderPage) throw new Error(`__renderPage() undefined (${route?.component})`);
  let html = await mod.__renderPage({
    request: {
      params,
      url: fullURL,
      canonicalURL: canonicalURL(fullURL.pathname, fullURL.origin),
    },
    children: [],
    props: pageProps,
    css: mod.css || [],
  });

  // 4. modify response
  // inject Vite HMR code (dev only)
  if (mode === 'development') html = injectViteClient(html);

  // replace client hydration scripts
  if (mode === 'development') html = resolveNpmImports(html);

  // 5. finish
  return html;
}

/** Injects Vite client code */
function injectViteClient(html: string): string {
  return html.replace('<head>', `<head><script type="module" src="/@vite/client"></script>`);
}

/** Convert npm specifier into Vite URL */
function resolveViteNpmPackage(spec: string): string {
  const pkg = parseNpmName(spec);
  if (!pkg) return spec;
  let viteURL = '/node_modules/.vite/'; // start with /node_modules/.vite
  viteURL += `${pkg.name}${pkg.subpath ? pkg.subpath.substr(1) : ''}`.replace(/[\/\.]/g, '_'); // flatten package name by replacing slashes (and dots) with underscores
  viteURL += '.js'; // add .js
  if (browserHash) viteURL += `?v=${browserHash}`; // add browserHash (if provided)
  return viteURL;
}

/** Replaces npm imports with Vite-friendly paths */
function resolveNpmImports(html: string): string {
  const $ = cheerio.load(html);

  // find all <script type="module">
  const moduleScripts = $('script[type="module"]');
  if (!moduleScripts.length) return html; // if none, return

  // for each <script>, update all npm imports with Vite-friendly imports
  moduleScripts.each((_, el) => {
    let code = $(el).html() || '';
    if (!code || $(el).attr('src')) return;
    try {
      const scan = () => eslexer.parse(code)[0].filter(({ n }) => n && parseNpmName(n));
      let specs = scan();
      while (specs.length) {
        const next = specs[0];
        let pkgName = resolveViteNpmPackage(next.n as string);
        if (next.d !== -1) pkgName = JSON.stringify(pkgName); // if dynamic import, stringify
        code = code.substring(0, next.s) + pkgName + code.substring(next.e);
        specs = scan();
      }
      $(el).html(code);
    } catch (err) {
      // if invalid JS, ignore (error will be thrown elsewhere)
    }
  });

  return $.html();
}

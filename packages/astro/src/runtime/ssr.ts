import cheerio from 'cheerio';
import * as eslexer from 'es-module-lexer';
import type { ViteDevServer } from 'vite';
import type { ComponentInstance, GetStaticPathsResult, Params, Props, RouteCache, RouteData, RuntimeMode, AstroConfig } from '../@types/astro';
import type { LogOptions } from '../logger';

import { fileURLToPath } from 'url';
import path from 'path';
import { generatePaginateFunction } from './paginate.js';
import { getParams, validateGetStaticPathsModule, validateGetStaticPathsResult } from './routing.js';
import { parseNpmName, canonicalURL as getCanonicalURL } from './util.js';
import type { AstroComponent, AstroComponentFactory } from '../internal';

interface SSROptions {
  /** an instance of the AstroConfig */
  astroConfig: AstroConfig,
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

export async function renderAstroComponent(component: InstanceType<typeof AstroComponent>) {
  let template = '';

  for await (const value of component) {
    if (value || value === 0) {
      template += value;
    }
  }

  return template;
}

export async function renderToString(result: any, componentFactory: AstroComponentFactory, props: any, children: any) {
  const Component = await componentFactory(result, props, children);
  let template = await renderAstroComponent(Component);
  return template
}

async function renderPage(result: any, Component: AstroComponentFactory, props: any, children: any) {
  const template = await renderToString(result, Component, props, children);
  const styles = Array.from(result.styles).map(style => `<style>${style}</style>`);
  const scripts = Array.from(result.scripts);
  return template.replace("</head>", styles.join('\n') + scripts.join('\n') + "</head>");
}

const cache = new Map();

// TODO: improve validation and error handling here.
async function resolveRenderers(viteServer: ViteDevServer, ids: string[]) {
  const resolve = viteServer.config.createResolver();
  const renderers = await Promise.all(ids.map(async renderer => {
    if (cache.has(renderer)) return cache.get(renderer);
    const resolvedRenderer: any = {};

    // We can dynamically import the renderer by itself because it shouldn't have 
    // any non-standard imports, the index is just meta info. 
    // The other entrypoints need to be loaded through Vite.
    const { default: instance } = await import(renderer);
    
    // This resolves the renderer's entrypoints to a final URL through Vite
    const getPath = async (src: string) => {
      const spec = path.posix.join(instance.name, src);
      const resolved = await resolve(spec);
      if (!resolved) {
        throw new Error(`Unable to resolve "${spec}" to a package!`)
      }
      return resolved;
    }

    resolvedRenderer.name = instance.name;
    if (instance.client) {
      resolvedRenderer.source = await getPath(instance.client);
    }
    if (Array.isArray(instance.hydrationPolyfills)) {
      resolvedRenderer.hydrationPolyfills = await Promise.all(instance.hydrationPolyfills.map((src: string) => getPath(src)));
    }
    if (Array.isArray(instance.polyfills)) {
      resolvedRenderer.polyfills = await Promise.all(instance.polyfills.map((src: string) => getPath(src)));
    }

      const { url } = await viteServer.moduleGraph.ensureEntryFromUrl(await getPath(instance.server));
      const { default: server } = await viteServer.ssrLoadModule(url);
      resolvedRenderer.ssr = server;

      cache.set(renderer, resolvedRenderer);
      return resolvedRenderer
  }));
  
  return renderers;
}

async function resolveImportedModules(viteServer: ViteDevServer, file: string) {
  const { url } = await viteServer.moduleGraph.ensureEntryFromUrl(file);
  const modulesByFile = viteServer.moduleGraph.getModulesByFile(url);
  if (!modulesByFile) {
    return {};
  }

  let importedModules: Record<string, any> = {};
  const moduleNodes = Array.from(modulesByFile);
  
  // Loop over the importedModules and grab the exports from each one.
  // We'll pass these to the shared $$result so renderers can match
  // components to their exported identifier and URL
  // NOTE: Important that this is parallelized as much as possible!
  await Promise.all(moduleNodes.map(moduleNode => {
    const entries = Array.from(moduleNode.importedModules);
    
    return Promise.all(entries.map(entry => {
      // Skip our internal import that every module will have
      if (entry.id?.endsWith('astro/dist/internal/index.js')) {
        return;
      }
      
      return viteServer.moduleGraph.ensureEntryFromUrl(entry.url).then(mod => {
        if (mod.ssrModule) {
          importedModules[mod.url] = mod.ssrModule;
          return;
        } else {
          return viteServer.ssrLoadModule(mod.url).then(result => {
            importedModules[mod.url] = result.ssrModule;
            return;
          })
        }
      })
    }))
  }))

  return importedModules
}

/** use Vite to SSR */
export async function ssr({ astroConfig, filePath, logging, mode, origin, pathname, route, routeCache, viteServer }: SSROptions): Promise<string> {
  // 1. load module
  const mod = (await viteServer.ssrLoadModule(fileURLToPath(filePath))) as ComponentInstance;

  // 1.5. resolve renderers and imported modules.
  // important that this happens _after_ ssrLoadModule, otherwise `importedModules` would be empty
  const [renderers, importedModules] = await Promise.all([
    resolveRenderers(viteServer, astroConfig.renderers),
    resolveImportedModules(viteServer, fileURLToPath(filePath))
  ]);

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

  const Component = await mod.default;
  if (!Component)
    throw new Error(`Expected an exported Astro component but recieved typeof ${typeof Component}`);
  if (!Component.isAstroComponentFactory) throw new Error(`Unable to SSR non-Astro component (${route?.component})`);

  let html = await renderPage({
    styles: new Set(),
    scripts: new Set(),
    /** This function returns the `Astro` faux-global */
    createAstro(props: any) {
      const site = new URL(origin);
      const url = new URL('.' + pathname, site);
      const canonicalURL = getCanonicalURL(pathname, astroConfig.buildOptions.site || origin)
      return { isPage: true, site, request: { url, canonicalURL }, props };
    },
    _metadata: { importedModules, renderers },
  }, Component, { }, null);

  // 4. modify response
  if (mode === 'development') {
    // inject Astro HMR code
    html = injectAstroHMR(html);
    // inject Vite HMR code
    html = injectViteClient(html);
    // replace client hydration scripts
    html = resolveNpmImports(html);
  }

  // 5. finish
  return html;
}

/** Injects Vite client code */
function injectViteClient(html: string): string {
  return html.replace('<head>', `<head><script type="module" src="/@vite/client"></script>`);
}

/** Injects Astro HMR client code */
function injectAstroHMR(html: string): string {
  return html.replace('<head>', `<head><script type="module" src="/@astro/runtime/hmr"></script>`);
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

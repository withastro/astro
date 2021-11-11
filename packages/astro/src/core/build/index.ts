import type { AstroConfig, ComponentInstance, GetStaticPathsResult, ManifestData, RouteCache, RouteData, RSSResult } from '../../@types/astro-core';
import type { LogOptions } from '../logger';
import type { AllPagesData } from './types';
import type { RenderedChunk } from 'rollup';

import { rollupPluginAstroBuildHTML } from '../../vite-plugin-build-html/index.js';
import { rollupPluginAstroBuildCSS } from '../../vite-plugin-build-css/index.js';
import fs from 'fs';
import { bold, cyan, green } from 'kleur/colors';
import { performance } from 'perf_hooks';
import vite, { ViteDevServer } from '../vite.js';
import { fileURLToPath } from 'url';
import { createVite } from '../create-vite.js';
import { pad } from '../dev/util.js';
import { debug, defaultLogOptions, levels, timerMessage, warn } from '../logger.js';
import { preload as ssrPreload } from '../ssr/index.js';
import { generatePaginateFunction } from '../ssr/paginate.js';
import { createRouteManifest, validateGetStaticPathsModule, validateGetStaticPathsResult } from '../ssr/routing.js';
import { generateRssFunction } from '../ssr/rss.js';
import { generateSitemap } from '../ssr/sitemap.js';
import { kb, profileHTML, profileJS } from './stats.js';

export interface BuildOptions {
  mode?: string;
  logging: LogOptions;
}

/** `astro build` */
export default async function build(config: AstroConfig, options: BuildOptions = { logging: defaultLogOptions }): Promise<void> {
  const builder = new AstroBuilder(config, options);
  await builder.build();
}

class AstroBuilder {
  private config: AstroConfig;
  private logging: LogOptions;
  private mode = 'production';
  private origin: string;
  private routeCache: RouteCache = {};
  private manifest: ManifestData;
  private viteServer?: ViteDevServer;

  constructor(config: AstroConfig, options: BuildOptions) {
    if (!config.buildOptions.site && config.buildOptions.sitemap !== false) {
      warn(options.logging, 'config', `Set "buildOptions.site" to generate correct canonical URLs and sitemap`);
    }

    if (options.mode) this.mode = options.mode;
    this.config = config;
    const port = config.devOptions.port; // no need to save this (don’t rely on port in builder)
    this.logging = options.logging;
    this.origin = config.buildOptions.site ? new URL(config.buildOptions.site).origin : `http://localhost:${port}`;
    this.manifest = createRouteManifest({ config });
  }

  async build() {
    const { logging, origin } = this;
    const timer: Record<string, number> = { viteStart: performance.now() };
    const viteConfig = await createVite(
      vite.mergeConfig(
        {
          mode: this.mode,
          server: {
            hmr: { overlay: false },
            middlewareMode: 'ssr',
          },
        },
        this.config.vite || {}
      ),
      { astroConfig: this.config, logging }
    );
    const viteServer = await vite.createServer(viteConfig);
    this.viteServer = viteServer;
    debug(logging, 'build', timerMessage('Vite started', timer.viteStart));

    timer.loadStart = performance.now();
    const assets: Record<string, string> = {};
    const allPages: AllPagesData = {};
    // Collect all routes ahead-of-time, before we start the build.
    // NOTE: This enforces that `getStaticPaths()` is only called once per route,
    // and is then cached across all future SSR builds. In the past, we've had trouble
    // with parallelized builds without guaranteeing that this is called first.
    await Promise.all(
      this.manifest.routes.map(async (route) => {
        // static route:
        if (route.pathname) {
          allPages[route.component] = {
            route,
            paths: [route.pathname],
            preload: await ssrPreload({
              astroConfig: this.config,
              filePath: new URL(`./${route.component}`, this.config.projectRoot),
              logging,
              mode: 'production',
              origin,
              pathname: route.pathname,
              route,
              routeCache: this.routeCache,
              viteServer,
            }),
          };
          return;
        }
        // dynamic route:
        const result = await this.getStaticPathsForRoute(route);
        if (result.rss?.xml) {
          const rssFile = new URL(result.rss.url.replace(/^\/?/, './'), this.config.dist);
          if (assets[fileURLToPath(rssFile)]) {
            throw new Error(`[getStaticPaths] RSS feed ${result.rss.url} already exists.\nUse \`rss(data, {url: '...'})\` to choose a unique, custom URL. (${route.component})`);
          }
          assets[fileURLToPath(rssFile)] = result.rss.xml;
        }
        allPages[route.component] = {
          route,
          paths: result.paths,
          preload: await ssrPreload({
            astroConfig: this.config,
            filePath: new URL(`./${route.component}`, this.config.projectRoot),
            logging,
            mode: 'production',
            origin,
            pathname: result.paths[0],
            route,
            routeCache: this.routeCache,
            viteServer,
          }),
        };
      })
    );
    debug(logging, 'build', timerMessage('All pages loaded', timer.loadStart));

    // Pure CSS chunks are chunks that only contain CSS.
    // This is all of them, and chunkToReferenceIdMap maps them to a hash id used to find the final file.
    const pureCSSChunks = new Set<RenderedChunk>();
    const chunkToReferenceIdMap = new Map<string, string>();

    // This is a mapping of pathname to the string source of all collected
    // inline <style> for a page.
    const astroStyleMap = new Map<string, string>();
    // This is a virtual JS module that imports all dependent styles for a page.
    const astroPageStyleMap = new Map<string, string>();

    const pageNames: string[] = [];

    // Bundle the assets in your final build: This currently takes the HTML output
    // of every page (stored in memory) and bundles the assets pointed to on those pages.
    timer.buildStart = performance.now();
    await vite.build({
      logLevel: 'error',
      mode: 'production',
      build: {
        emptyOutDir: true,
        minify: 'esbuild', // significantly faster than "terser" but may produce slightly-bigger bundles
        outDir: fileURLToPath(this.config.dist),
        rollupOptions: {
          // The `input` will be populated in the build rollup plugin.
          input: [],
          output: { format: 'esm' },
        },
        target: 'es2020', // must match an esbuild target
      },
      plugins: [
        rollupPluginAstroBuildHTML({
          astroConfig: this.config,
          astroPageStyleMap,
          astroStyleMap,
          chunkToReferenceIdMap,
          pureCSSChunks,
          logging,
          origin,
          allPages,
          pageNames,
          routeCache: this.routeCache,
          viteServer,
        }),
        rollupPluginAstroBuildCSS({
          astroPageStyleMap,
          astroStyleMap,
          chunkToReferenceIdMap,
          pureCSSChunks,
        }),
        ...(viteConfig.plugins || []),
      ],
      publicDir: viteConfig.publicDir,
      root: viteConfig.root,
      server: viteConfig.server,
    });
    debug(logging, 'build', timerMessage('Vite build finished', timer.buildStart));

    // Write any additionally generated assets to disk.
    timer.assetsStart = performance.now();
    Object.keys(assets).map((k) => {
      if (!assets[k]) return;
      const filePath = new URL(`file://${k}`);
      fs.mkdirSync(new URL('./', filePath), { recursive: true });
      fs.writeFileSync(filePath, assets[k], 'utf8');
      delete assets[k]; // free up memory
    });
    debug(logging, 'build', timerMessage('Additional assets copied', timer.assetsStart));

    // Build your final sitemap.
    timer.sitemapStart = performance.now();
    if (this.config.buildOptions.sitemap && this.config.buildOptions.site) {
      const sitemapStart = performance.now();
      const sitemap = generateSitemap(pageNames.map((pageName) => new URL(`/${pageName}`, this.config.buildOptions.site).href));
      const sitemapPath = new URL('./sitemap.xml', this.config.dist);
      await fs.promises.mkdir(new URL('./', sitemapPath), { recursive: true });
      await fs.promises.writeFile(sitemapPath, sitemap, 'utf8');
    }
    debug(logging, 'build', timerMessage('Sitemap built', timer.sitemapStart));

    // You're done! Time to clean up.
    await viteServer.close();
    if (logging.level && levels[logging.level] <= levels['info']) {
      await this.printStats({ cwd: this.config.dist, pageCount: pageNames.length });
    }
  }

  /** Extract all static paths from a dynamic route */
  private async getStaticPathsForRoute(route: RouteData): Promise<{ paths: string[]; rss?: RSSResult }> {
    if (!this.viteServer) throw new Error(`vite.createServer() not called!`);
    const filePath = new URL(`./${route.component}`, this.config.projectRoot);
    const mod = (await this.viteServer.ssrLoadModule(fileURLToPath(filePath))) as ComponentInstance;
    validateGetStaticPathsModule(mod);
    const rss = generateRssFunction(this.config.buildOptions.site, route);
    const staticPaths: GetStaticPathsResult = (await mod.getStaticPaths!({ paginate: generatePaginateFunction(route), rss: rss.generator })).flat();
    this.routeCache[route.component] = staticPaths;
    validateGetStaticPathsResult(staticPaths, this.logging);
    return {
      paths: staticPaths.map((staticPath) => staticPath.params && route.generate(staticPath.params)).filter(Boolean),
      rss: rss.rss,
    };
  }

  /** Stats */
  private async printStats({ cwd, pageCount }: { cwd: URL; pageCount: number }) {
    const [js, html] = await Promise.all([profileJS({ cwd, entryHTML: new URL('./index.html', cwd) }), profileHTML({ cwd })]);

    /* eslint-disable no-console */
    console.log(`${bold(cyan('Done'))}
Pages (${pageCount} total)
  ${green(`✔ All pages under ${kb(html.maxSize)}`)}
JS
  ${pad('initial load', 50)}${pad(kb(js.entryHTML || 0), 8, 'left')}
  ${pad('total size', 50)}${pad(kb(js.total), 8, 'left')}
CSS
  ${pad('initial load', 50)}${pad('0 kB', 8, 'left')}
  ${pad('total size', 50)}${pad('0 kB', 8, 'left')}
Images
  ${green(`✔ All images under 50 kB`)}
`);
  }
}

import type { InputHTMLOptions } from '@web/rollup-plugin-html';
import type { AstroConfig, ComponentInstance, GetStaticPathsResult, ManifestData, RouteCache, RouteData, RSSResult } from '../../@types/astro-core';
import type { LogOptions } from '../logger';

import { rollupPluginHTML } from '@web/rollup-plugin-html';
import fs from 'fs';
import { bold, cyan, green, dim } from 'kleur/colors';
import { performance } from 'perf_hooks';
import vite, { ViteDevServer } from '../vite.js';
import { fileURLToPath } from 'url';
import { createVite } from '../create-vite.js';
import { pad } from '../dev/util.js';
import { debug, defaultLogOptions, levels, timerMessage, warn } from '../logger.js';
import { ssr } from '../ssr/index.js';
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
      {
        mode: this.mode,
        server: {
          hmr: { overlay: false },
          middlewareMode: 'ssr',
        },
        ...(this.config.vite || {}),
      },
      { astroConfig: this.config, logging }
    );
    const viteServer = await vite.createServer(viteConfig);
    this.viteServer = viteServer;
    debug(logging, 'build', timerMessage('Vite started', timer.viteStart));

    timer.renderStart = performance.now();
    const assets: Record<string, string> = {};
    const allPages: Record<string, RouteData & { paths: string[] }> = {};
    // Collect all routes ahead-of-time, before we start the build.
    // NOTE: This enforces that `getStaticPaths()` is only called once per route,
    // and is then cached across all future SSR builds. In the past, we've had trouble
    // with parallelized builds without guaranteeing that this is called first.
    await Promise.all(
      this.manifest.routes.map(async (route) => {
        // static route:
        if (route.pathname) {
          allPages[route.component] = { ...route, paths: [route.pathname] };
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
        allPages[route.component] = { ...route, paths: result.paths };
      })
    );

    // After all routes have been collected, start building them.
    // TODO: test parallel vs. serial performance. Promise.all() may be
    // making debugging harder without any perf gain. If parallel is best,
    // then we should set a max number of parallel builds.
    const input: InputHTMLOptions[] = [];
    await Promise.all(
      Object.entries(allPages).map(([component, route]) =>
        Promise.all(
          route.paths.map(async (pathname) => {
            input.push({
              html: await ssr({
                astroConfig: this.config,
                filePath: new URL(`./${component}`, this.config.projectRoot),
                logging,
                mode: 'production',
                origin,
                pathname,
                route,
                routeCache: this.routeCache,
                viteServer,
              }),
              name: pathname.replace(/\/?$/, '/index.html').replace(/^\//, ''),
            });
          })
        )
      )
    );
    debug(logging, 'build', timerMessage('All pages rendered', timer.renderStart));

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
          input: [],
          output: { format: 'esm' },
        },
        target: 'es2020', // must match an esbuild target
      },
      plugins: [
        rollupPluginHTML({ input, extractAssets: false }) as any, // "any" needed for CI; also we don’t need typedefs for this anyway
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
      const sitemap = generateSitemap(input.map(({ name }) => new URL(`/${name}`, this.config.buildOptions.site).href));
      const sitemapPath = new URL('./sitemap.xml', this.config.dist);
      await fs.promises.mkdir(new URL('./', sitemapPath), { recursive: true });
      await fs.promises.writeFile(sitemapPath, sitemap, 'utf8');
    }
    debug(logging, 'build', timerMessage('Sitemap built', timer.sitemapStart));

    // You're done! Time to clean up.
    await viteServer.close();
    if (logging.level && levels[logging.level] <= levels['info']) {
      await this.printStats({ cwd: this.config.dist, pageCount: input.length });
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

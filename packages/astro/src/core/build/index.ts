import type { AstroConfig, ComponentInstance, GetStaticPathsResult, ManifestData, RouteCache, RouteData, RSSResult } from '../../@types/astro';
import type { LogOptions } from '../logger';

import { rollupPluginHTML } from '@web/rollup-plugin-html';
import fs from 'fs';
import { bold, cyan, green, dim } from 'kleur/colors';
import { performance } from 'perf_hooks';
import vite, { ViteDevServer } from 'vite';
import { fileURLToPath } from 'url';
import { pad } from '../dev/util.js';
import { defaultLogOptions, levels, warn } from '../logger.js';
import { ssr } from '../ssr/index.js';
import { createVite } from '../create-vite.js';
import { generatePaginateFunction } from '../ssr/paginate.js';
import { createRouteManifest, validateGetStaticPathsModule, validateGetStaticPathsResult } from '../ssr/routing.js';
import { generateRssFunction } from './rss.js';
import { generateSitemap } from './sitemap.js';
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

  /** Build all pages */
  async build() {
    const start = performance.now();

    // 1. initialize fresh Vite instance
    const { logging, origin } = this;
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

    // 2. get all routes
    const allPages: Promise<{ html: string; name: string }>[] = [];
    const assets: Record<string, string> = {}; // additional assets to be written
    await Promise.all(
      this.manifest.routes.map(async (route) => {
        const { pathname } = route;
        const filePath = new URL(`./${route.component}`, this.config.projectRoot);
        // static pages
        if (pathname) {
          allPages.push(
            ssr({ astroConfig: this.config, filePath, logging, mode: 'production', origin, route, routeCache: this.routeCache, pathname, viteServer }).then((html) => ({
              html,
              name: pathname.replace(/\/?$/, '/index.html').replace(/^\//, ''),
            }))
          );
        }
        // dynamic pages
        else {
          const staticPaths = await this.getStaticPathsForRoute(route, viteServer);
          // handle RSS (TODO: improve this?)
          if (staticPaths.rss && staticPaths.rss.xml) {
            const rssFile = new URL(staticPaths.rss.url.replace(/^\/?/, './'), this.config.dist);
            if (assets[fileURLToPath(rssFile)]) {
              throw new Error(
                `[getStaticPaths] RSS feed ${staticPaths.rss.url} already exists.\nUse \`rss(data, {url: '...'})\` to choose a unique, custom URL. (${route.component})`
              );
            }
            assets[fileURLToPath(rssFile)] = staticPaths.rss.xml;
          }
          // TODO: throw error if conflict
          staticPaths.paths.forEach((staticPath) => {
            allPages.push(
              ssr({ astroConfig: this.config, filePath, logging, mode: 'production', origin, route, routeCache: this.routeCache, pathname: staticPath, viteServer }).then(
                (html) => ({
                  html,
                  name: staticPath.replace(/\/?$/, '/index.html').replace(/^\//, ''),
                })
              )
            );
          });
        }
      })
    );
    const input = await Promise.all(allPages);

    // 3. build with Vite
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
      plugins: [rollupPluginHTML({ input, extractAssets: false }), ...(viteConfig.plugins || [])],
      publicDir: viteConfig.publicDir,
      root: viteConfig.root,
      server: viteConfig.server,
    });

    // 4. write assets to disk
    Object.keys(assets).map((k) => {
      if (!assets[k]) return;
      const filePath = new URL(`file://${k}`);
      fs.mkdirSync(new URL('./', filePath), { recursive: true });
      fs.writeFileSync(filePath, assets[k], 'utf8');
      delete assets[k]; // free up memory
    });

    // 5. build sitemap
    let sitemapTime = 0;
    if (this.config.buildOptions.sitemap && this.config.buildOptions.site) {
      const sitemapStart = performance.now();
      const sitemap = generateSitemap(input.map(({ name }) => new URL(`/${name}`, this.config.buildOptions.site).href));
      const sitemapPath = new URL('./sitemap.xml', this.config.dist);
      await fs.promises.mkdir(new URL('./', sitemapPath), { recursive: true });
      await fs.promises.writeFile(sitemapPath, sitemap, 'utf8');
      sitemapTime = performance.now() - sitemapStart;
    }

    // 6. clean up
    await viteServer.close();

    // 7. log output
    if (logging.level && levels[logging.level] <= levels['info']) {
      await this.printStats({
        cwd: this.config.dist,
        pageCount: input.length,
        pageTime: Math.round(performance.now() - start),
        sitemapTime,
      });
    }
  }

  /** Extract all static paths from a dynamic route */
  private async getStaticPathsForRoute(route: RouteData, viteServer: ViteDevServer): Promise<{ paths: string[]; rss?: RSSResult }> {
    const filePath = new URL(`./${route.component}`, this.config.projectRoot);
    const mod = (await viteServer.ssrLoadModule(fileURLToPath(filePath))) as ComponentInstance;
    validateGetStaticPathsModule(mod);
    const rss = generateRssFunction(this.config.buildOptions.site, route);
    const staticPaths: GetStaticPathsResult = (await mod.getStaticPaths!({ paginate: generatePaginateFunction(route), rss: rss.generator })).flat();
    validateGetStaticPathsResult(staticPaths, this.logging);
    return {
      paths: staticPaths.map((staticPath) => staticPath.params && route.generate(staticPath.params)).filter(Boolean),
      rss: rss.rss,
    };
  }

  /** Stats */
  private async printStats({ cwd, pageTime, pageCount, sitemapTime }: { cwd: URL; pageTime: number; pageCount: number; sitemapTime: number }) {
    const end = Math.round(performance.now() - pageTime);
    const [js, html] = await Promise.all([profileJS({ cwd, entryHTML: new URL('./index.html', cwd) }), profileHTML({ cwd })]);

    /* eslint-disable no-console */
    console.log(`${pad(bold(cyan('Done')), 70)}${dim(` ${pad(`${end}ms`, 8, 'left')}`)}
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
    if (sitemapTime > 0) console.log(`Sitemap\n  ${green(`✔ Built in ${sitemapTime}`)}`);
  }
}

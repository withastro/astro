import cheerio from 'cheerio';
import del from 'del';
import eslexer from 'es-module-lexer';
import fs from 'fs';
import { bold, green, red, underline, yellow } from 'kleur/colors';
import mime from 'mime';
import path from 'path';
import { performance } from 'perf_hooks';
import glob from 'tiny-glob';
import hash from 'shorthash';
import { fileURLToPath } from 'url';
import type { AstroConfig, BuildOutput, BundleMap, PageDependencies, RouteData, RuntimeMode, ScriptInfo } from './@types/astro';
import { bundleCSS } from './build/bundle/css.js';
import { bundleJS, bundleHoistedJS, collectJSImports } from './build/bundle/js.js';
import { buildStaticPage, getStaticPathsForPage } from './build/page.js';
import { generateSitemap } from './build/sitemap.js';
import { collectBundleStats, logURLStats, mapBundleStatsToURLStats } from './build/stats.js';
import { getDistPath, stopTimer } from './build/util.js';
import type { LogOptions } from './logger';
import { debug, defaultLogDestination, defaultLogLevel, error, info, warn } from './logger.js';
import { createRuntime } from './runtime.js';

const defaultLogging: LogOptions = {
  level: defaultLogLevel,
  dest: defaultLogDestination,
};

/** Is this URL remote or embedded? */
function isRemoteOrEmbedded(url: string) {
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//') || url.startsWith('data:');
}

/** The primary build action */
export async function build(astroConfig: AstroConfig, logging: LogOptions = defaultLogging): Promise<0 | 1> {
  const { projectRoot } = astroConfig;
  const buildState: BuildOutput = {};
  const depTree: BundleMap = {};
  const timer: Record<string, number> = {};

  const runtimeLogging: LogOptions = {
    level: 'error',
    dest: defaultLogDestination,
  };

  // warn users if missing config item in build that may result in broken SEO (can’t disable, as they should provide this)
  if (!astroConfig.buildOptions.site) {
    warn(logging, 'config', `Set "buildOptions.site" to generate correct canonical URLs and sitemap`);
  }

  const mode: RuntimeMode = 'production';
  const astroRuntime = await createRuntime(astroConfig, { mode, logging: runtimeLogging });
  const { runtimeConfig } = astroRuntime;
  const { snowpackRuntime } = runtimeConfig;

  try {
    // 0. erase build directory
    await del(fileURLToPath(astroConfig.dist));

    /**
     * 1. Build Pages
     * Source files are built in parallel and stored in memory. Most assets are also gathered here, too.
     */
    timer.build = performance.now();
    info(logging, 'build', yellow('! building pages...'));
    const allRoutesAndPaths = await Promise.all(
      runtimeConfig.manifest.routes.map(async (route): Promise<[RouteData, string[]]> => {
        if (route.path) {
          return [route, [route.path]];
        } else {
          const result = await getStaticPathsForPage({
            astroConfig,
            astroRuntime,
            route,
            snowpackRuntime,
            logging,
          });
          if (result.rss.xml) {
            if (buildState[result.rss.url]) {
              throw new Error(`[getStaticPaths] RSS feed ${result.rss.url} already exists.\nUse \`rss(data, {url: '...'})\` to choose a unique, custom URL. (${route.component})`);
            }
            buildState[result.rss.url] = {
              srcPath: new URL(result.rss.url, projectRoot),
              contents: result.rss.xml,
              contentType: 'text/xml',
              encoding: 'utf8',
            };
          }
          return [route, result.paths];
        }
      })
    );
    try {
      await Promise.all(
        allRoutesAndPaths.map(async ([route, paths]: [RouteData, string[]]) => {
          for (const p of paths) {
            await buildStaticPage({
              astroConfig,
              buildState,
              route,
              path: p,
              astroRuntime,
            });
          }
        })
      );
    } catch (e) {
      if (e.filename) {
        let stack = e.stack
          .replace(/Object\.__render \(/gm, '')
          .replace(/\/_astro\/(.+)\.astro\.js\:\d+\:\d+\)/gm, (_: string, $1: string) => 'file://' + fileURLToPath(projectRoot) + $1 + '.astro')
          .split('\n');
        stack.splice(1, 0, `    at file://${e.filename}`);
        stack = stack.join('\n');
        error(
          logging,
          'build',
          `${red(`Unable to render ${underline(e.filename.replace(fileURLToPath(projectRoot), ''))}`)}

${stack}
`
        );
      } else {
        error(logging, 'build', e.message);
      }
      error(logging, 'build', red('✕ building pages failed!'));

      await astroRuntime.shutdown();
      return 1;
    }
    info(logging, 'build', green('✔'), 'pages built.');
    debug(logging, 'build', `built pages [${stopTimer(timer.build)}]`);

    // after pages are built, build depTree
    timer.deps = performance.now();
    const scanPromises: Promise<void>[] = [];

    await eslexer.init;
    for (const id of Object.keys(buildState)) {
      if (buildState[id].contentType !== 'text/html') continue; // only scan HTML files
      const pageDeps = findDeps(buildState[id].contents as string, {
        astroConfig,
        srcPath: buildState[id].srcPath,
        id,
      });
      depTree[id] = pageDeps;

      // while scanning we will find some unbuilt files; make sure those are all built while scanning
      for (const url of [...pageDeps.js, ...pageDeps.css, ...pageDeps.images]) {
        if (!buildState[url])
          scanPromises.push(
            astroRuntime.load(url).then((result) => {
              if (result.statusCode !== 200) {
                if (result.statusCode === 404) {
                  throw new Error(`${buildState[id].srcPath.href}: could not find "${url}"`);
                }
                // there shouldn’t be a build error here
                throw (result as any).error || new Error(`unexpected status ${result.statusCode} when loading ${url}`);
              }
              buildState[url] = {
                srcPath: new URL(url, projectRoot),
                contents: result.contents,
                contentType: result.contentType || mime.getType(url) || '',
              };
            })
          );
      }
    }
    await Promise.all(scanPromises);
    debug(logging, 'build', `scanned deps [${stopTimer(timer.deps)}]`);

    /**
     * 2. Bundling 1st Pass: In-memory
     * Bundle CSS, and anything else that can happen in memory (for now, JS bundling happens after writing to disk)
     */
    info(logging, 'build', yellow('! optimizing css...'));
    timer.prebundleCSS = performance.now();
    await Promise.all([
      bundleCSS({ buildState, astroConfig, logging, depTree }).then(() => {
        debug(logging, 'build', `bundled CSS [${stopTimer(timer.prebundleCSS)}]`);
      }),
      bundleHoistedJS({ buildState, astroConfig, logging, depTree, runtime: astroRuntime, dist: astroConfig.dist }),
      // TODO: optimize images?
    ]);
    // TODO: minify HTML?
    info(logging, 'build', green('✔'), 'css optimized.');

    /**
     * 3. Write to disk
     * Also clear in-memory bundle
     */
    // collect stats output
    const urlStats = await collectBundleStats(buildState, depTree);

    // collect JS imports for bundling
    const jsImports = await collectJSImports(buildState);

    // write sitemap
    if (astroConfig.buildOptions.sitemap && astroConfig.buildOptions.site) {
      timer.sitemap = performance.now();
      info(logging, 'build', yellow('! creating sitemap...'));
      const sitemap = generateSitemap(buildState, astroConfig.buildOptions.site);
      const sitemapPath = new URL('sitemap.xml', astroConfig.dist);
      await fs.promises.mkdir(path.dirname(fileURLToPath(sitemapPath)), { recursive: true });
      await fs.promises.writeFile(sitemapPath, sitemap, 'utf8');
      info(logging, 'build', green('✔'), 'sitemap built.');
      debug(logging, 'build', `built sitemap [${stopTimer(timer.sitemap)}]`);
    }

    // write to disk and free up memory
    timer.write = performance.now();
    await Promise.all(
      Object.keys(buildState).map(async (id) => {
        const outPath = new URL(`.${id}`, astroConfig.dist);
        const parentDir = path.dirname(fileURLToPath(outPath));
        await fs.promises.mkdir(parentDir, { recursive: true });
        await fs.promises.writeFile(outPath, buildState[id].contents, buildState[id].encoding);
        delete buildState[id];
        delete depTree[id];
      })
    );
    debug(logging, 'build', `wrote files to disk [${stopTimer(timer.write)}]`);

    /**
     * 4. Copy Public Assets
     */
    if (fs.existsSync(astroConfig.public)) {
      info(logging, 'build', yellow(`! copying public folder...`));
      timer.public = performance.now();
      const cwd = fileURLToPath(astroConfig.public);
      const publicFiles = await glob('**/*', { cwd, filesOnly: true });
      await Promise.all(
        publicFiles.map(async (filepath) => {
          const srcPath = new URL(filepath, astroConfig.public);
          const distPath = new URL(filepath, astroConfig.dist);
          await fs.promises.mkdir(path.dirname(fileURLToPath(distPath)), { recursive: true });
          await fs.promises.copyFile(srcPath, distPath);
        })
      );
      debug(logging, 'build', `copied public folder [${stopTimer(timer.public)}]`);
      info(logging, 'build', green('✔'), 'public folder copied.');
    } else {
      if (path.basename(astroConfig.public.toString()) !== 'public') {
        info(logging, 'tip', yellow(`! no public folder ${astroConfig.public} found...`));
      }
    }

    /**
     * 5. Bundling 2nd Pass: On disk
     * Bundle JS, which requires hard files to optimize
     */
    info(logging, 'build', yellow(`! bundling...`));
    if (jsImports.size > 0) {
      timer.bundleJS = performance.now();
      const jsStats = await bundleJS(jsImports, { dist: astroConfig.dist, astroRuntime });
      mapBundleStatsToURLStats({ urlStats, depTree, bundleStats: jsStats });
      debug(logging, 'build', `bundled JS [${stopTimer(timer.bundleJS)}]`);
      info(logging, 'build', green(`✔`), 'bundling complete.');
    }

    /**
     * 6. Print stats
     */
    logURLStats(logging, urlStats);
    await astroRuntime.shutdown();
    info(logging, 'build', bold(green('▶ Build Complete!')));
    return 0;
  } catch (err) {
    error(logging, 'build', err.message);
    await astroRuntime.shutdown();
    return 1;
  }
}

/** Given an HTML string, collect <link> and <img> tags */
export function findDeps(html: string, { astroConfig, srcPath }: { astroConfig: AstroConfig; srcPath: URL; id: string }): PageDependencies {
  const pageDeps: PageDependencies = {
    js: new Set<string>(),
    css: new Set<string>(),
    images: new Set<string>(),
    hoistedJS: new Map<string, ScriptInfo>(),
  };

  const $ = cheerio.load(html);

  $('script').each((_i, el) => {
    const src = $(el).attr('src');
    const hoist = $(el).attr('data-astro') === 'hoist';
    if (hoist) {
      if (src) {
        pageDeps.hoistedJS.set(src, {
          src,
        });
      } else {
        let content = $(el).html() || '';
        pageDeps.hoistedJS.set(`astro-virtual:${hash.unique(content)}`, {
          content,
        });
      }
    } else if (src) {
      if (isRemoteOrEmbedded(src)) return;
      pageDeps.js.add(getDistPath(src, { astroConfig, srcPath }));
    } else {
      const text = $(el).html();
      if (!text) return;
      const [imports] = eslexer.parse(text);
      for (const spec of imports) {
        const importSrc = spec.n;
        if (importSrc && !isRemoteOrEmbedded(importSrc)) {
          pageDeps.js.add(getDistPath(importSrc, { astroConfig, srcPath }));
        }
      }
    }
  });

  $('link[href]').each((_i, el) => {
    const href = $(el).attr('href');
    if (href && !isRemoteOrEmbedded(href) && ($(el).attr('rel') === 'stylesheet' || $(el).attr('type') === 'text/css' || href.endsWith('.css'))) {
      const dist = getDistPath(href, { astroConfig, srcPath });
      pageDeps.css.add(dist);
    }
  });

  $('img[src]').each((_i, el) => {
    const src = $(el).attr('src');
    if (src && !isRemoteOrEmbedded(src)) {
      pageDeps.images.add(getDistPath(src, { astroConfig, srcPath }));
    }
  });

  $('img[srcset]').each((_i, el) => {
    const srcset = $(el).attr('srcset') || '';
    const sources = srcset.split(',');
    const srces = sources.map((s) => s.trim().split(' ')[0]);
    for (const src of srces) {
      if (!isRemoteOrEmbedded(src)) {
        pageDeps.images.add(getDistPath(src, { astroConfig, srcPath }));
      }
    }
  });

  // important: preserve the scan order of deps! order matters on pages

  return pageDeps;
}

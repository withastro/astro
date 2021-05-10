import 'source-map-support/register.js';
import type { AstroConfig, BundleMap, BuildOutput, RuntimeMode, PageDependencies } from './@types/astro';
import type { LogOptions } from './logger';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import cheerio from 'cheerio';
import del from 'del';
import { bold, green, yellow } from 'kleur/colors';
import mime from 'mime';
import { fdir } from 'fdir';
import { bundleCSS } from './build/bundle/css.js';
import { bundleJS, collectJSImports } from './build/bundle/js';
import { buildCollectionPage, buildStaticPage, getPageType } from './build/page.js';
import { generateSitemap } from './build/sitemap.js';
import { logURLStats, collectBundleStats, mapBundleStatsToURLStats } from './build/stats.js';
import { getDistPath, sortSet, stopTimer } from './build/util.js';
import { debug, defaultLogDestination, error, info, trapWarn } from './logger.js';
import { createRuntime } from './runtime.js';

const logging: LogOptions = {
  level: 'debug',
  dest: defaultLogDestination,
};

/** Return contents of src/pages */
async function allPages(root: URL) {
  const api = new fdir()
    .filter((p) => /\.(astro|md)$/.test(p))
    .withFullPaths()
    .crawl(fileURLToPath(root));
  const files = await api.withPromise();
  return files as string[];
}

/** Is this URL remote? */
function isRemote(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) return true;
  return false;
}

/** The primary build action */
export async function build(astroConfig: AstroConfig): Promise<0 | 1> {
  const { projectRoot, astroRoot } = astroConfig;
  const dist = new URL(astroConfig.dist + '/', projectRoot);
  const pageRoot = new URL('./pages/', astroRoot);
  const buildState: BuildOutput = {};
  const depTree: BundleMap = {};
  const timer: Record<string, number> = {};

  const runtimeLogging: LogOptions = {
    level: 'error',
    dest: defaultLogDestination,
  };

  const mode: RuntimeMode = 'production';
  const runtime = await createRuntime(astroConfig, { mode, logging: runtimeLogging });
  const { runtimeConfig } = runtime;
  const { backendSnowpack: snowpack } = runtimeConfig;

  const pages = await allPages(pageRoot);

  // 0. erase build directory
  await del(fileURLToPath(dist));

  /**
   * 1. Build Pages
   * Source files are built in parallel and stored in memory. Most assets are also gathered here, too.
   */
  timer.build = performance.now();
  try {
    info(logging, 'build', yellow('! building pages...'));
    const release = trapWarn(); // Vue also console.warns, this silences it.
    await Promise.all(
      pages.map(async (pathname) => {
        const filepath = new URL(`file://${pathname}`);
        const buildPage = getPageType(filepath) === 'collection' ? buildCollectionPage : buildStaticPage;
        await buildPage({
          astroConfig,
          buildState,
          filepath,
          logging,
          mode,
          resolvePackageUrl: (pkgName: string) => snowpack.getUrlForPackage(pkgName),
          runtime,
          site: astroConfig.buildOptions.site,
        });
      })
    );
    info(logging, 'build', green('✔'), 'pages built.');
    release();
  } catch (err) {
    error(logging, 'generate', err);
    await runtime.shutdown();
    return 1;
  }
  debug(logging, 'build', `built pages [${stopTimer(timer.build)}]`);

  // after pages are built, build depTree
  timer.deps = performance.now();
  const scanPromises: Promise<void>[] = [];
  for (const id of Object.keys(buildState)) {
    if (buildState[id].contentType !== 'text/html') continue; // only scan HTML files
    const pageDeps = findDeps(buildState[id].contents as string, {
      astroConfig,
      srcPath: buildState[id].srcPath,
    });
    depTree[id] = pageDeps;

    // while scanning we will find some unbuilt files; make sure those are all built while scanning
    for (const url of [...pageDeps.js, ...pageDeps.css, ...pageDeps.images]) {
      if (!buildState[url])
        scanPromises.push(
          runtime.load(url).then((result) => {
            if (result.statusCode !== 200) {
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
  try {
    await Promise.all(scanPromises);
  } catch (err) {
    error(logging, 'build', err);
    return 1;
  }
  debug(logging, 'build', `scanned deps [${stopTimer(timer.deps)}]`);

  /**
   * 2. Bundling 1st Pass: In-memory
   * Bundle CSS, and anything else that can happen in memory (for now, JS bundling happens after writing to disk)
   */
  info(logging, 'build', yellow('! optimizing css...'));
  timer.prebundle = performance.now();
  await Promise.all([
    bundleCSS({ buildState, astroConfig, logging, depTree }).then(() => {
      debug(logging, 'build', `bundled CSS [${stopTimer(timer.prebundle)}]`);
    }),
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
    const sitemapPath = new URL('sitemap.xml', dist);
    await fs.promises.mkdir(path.dirname(fileURLToPath(sitemapPath)), { recursive: true });
    await fs.promises.writeFile(sitemapPath, sitemap, 'utf8');
    info(logging, 'build', green('✔'), 'sitemap built.');
    debug(logging, 'build', `built sitemap [${stopTimer(timer.sitemap)}]`);
  } else if (astroConfig.buildOptions.sitemap) {
    info(logging, 'tip', `Set "buildOptions.site" in astro.config.mjs to generate a sitemap.xml, or set "buildOptions.sitemap: false" to disable this message.`);
  }

  // write to disk and free up memory
  timer.write = performance.now();
  await Promise.all(
    Object.keys(buildState).map(async (id) => {
      const outPath = new URL(`.${id}`, dist);
      const parentDir = path.posix.dirname(fileURLToPath(outPath));
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
    const pub = astroConfig.public;
    const publicFiles = (await new fdir().withFullPaths().crawl(fileURLToPath(pub)).withPromise()) as string[];
    await Promise.all(
      publicFiles.map(async (filepath) => {
        const fileUrl = new URL(`file://${filepath}`);
        const rel = path.relative(fileURLToPath(pub), fileURLToPath(fileUrl));
        const outPath = new URL('./' + rel, dist);
        await fs.promises.mkdir(path.dirname(fileURLToPath(outPath)), { recursive: true });
        await fs.promises.copyFile(fileUrl, outPath);
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
    try {
      timer.bundleJS = performance.now();
      const jsStats = await bundleJS(jsImports, { dist: new URL(dist + '/', projectRoot), runtime });
      mapBundleStatsToURLStats({ urlStats, depTree, bundleStats: jsStats });
      debug(logging, 'build', `bundled JS [${stopTimer(timer.bundleJS)}]`);
      info(logging, 'build', green(`✔`), 'bundling complete.');
    } catch (err) {
      error(logging, 'build', err);
      await runtime.shutdown();
      return 1;
    }
  }

  /**
   * 6. Print stats
   */
  logURLStats(logging, urlStats);
  await runtime.shutdown();
  info(logging, 'build', bold(green('▶ Build Complete!')));
  return 0;
}

/** Given an HTML string, collect <link> and <img> tags */
export function findDeps(html: string, { astroConfig, srcPath }: { astroConfig: AstroConfig; srcPath: URL }): PageDependencies {
  const pageDeps: PageDependencies = {
    js: new Set<string>(),
    css: new Set<string>(),
    images: new Set<string>(),
  };

  const $ = cheerio.load(html);

  $('script').each((i, el) => {
    const src = $(el).attr('src');
    if (src && !isRemote(src)) {
      pageDeps.js.add(getDistPath(src, { astroConfig, srcPath }));
    }
  });

  $('link[href]').each((i, el) => {
    const href = $(el).attr('href');
    if (href && !isRemote(href) && ($(el).attr('rel') === 'stylesheet' || $(el).attr('type') === 'text/css' || href.endsWith('.css'))) {
      const dist = getDistPath(href, { astroConfig, srcPath });
      pageDeps.css.add(dist);
    }
  });

  $('img[src]').each((i, el) => {
    const src = $(el).attr('src');
    if (src && !isRemote(src)) {
      pageDeps.images.add(getDistPath(src, { astroConfig, srcPath }));
    }
  });

  // sort (makes things a bit more predictable)
  pageDeps.js = sortSet(pageDeps.js);
  pageDeps.css = sortSet(pageDeps.css);
  pageDeps.images = sortSet(pageDeps.images);

  return pageDeps;
}

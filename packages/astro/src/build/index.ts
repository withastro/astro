import 'source-map-support/register.js';
import type { AstroConfig, BundleMap, BuildOutput, RuntimeMode } from '../@types/astro';
import type { LogOptions } from '../logger';
import type { AstroRuntime, LoadResult } from '../runtime';

import fs from 'fs';
import { bold, green, yellow, underline } from 'kleur/colors';
import del from 'del';
import path from 'path';
import mime from 'mime';
import { fileURLToPath } from 'url';
import { fdir } from 'fdir';
import { defaultLogDestination, error, info, trapWarn } from '../logger.js';
import { createRuntime } from '../runtime.js';
import { bundleJS } from './bundle/js.js';
import { bundleCSS } from './bundle/css.js';
import { generateRSS } from './rss.js';
import { collectDynamicImports, scanHTML } from './scan.js';
import { generateSitemap } from './sitemap.js';
import { mapBundleStatsToURLStats, logURLStats, collectBundleStats } from './stats.js';
import { canonicalURL } from './util.js';

interface PageBuildOptions {
  astroRoot: URL;
  buildState: BuildOutput;
  filepath: URL;
  runtime: AstroRuntime;
  site?: string;
}

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

/** Collection utility */
function getPageType(filepath: URL): 'collection' | 'static' {
  if (/\$[^.]+.astro$/.test(filepath.pathname)) return 'collection';
  return 'static';
}

/** Build collection */
async function buildCollectionPage({ astroRoot, filepath, runtime, site, buildState }: PageBuildOptions): Promise<void> {
  const rel = path.relative(fileURLToPath(astroRoot) + '/pages', fileURLToPath(filepath)); // pages/index.astro
  const pagePath = `/${rel.replace(/\$([^.]+)\.astro$/, '$1')}`;
  const srcPath = fileURLToPath(new URL('pages/' + rel, astroRoot));
  const builtURLs = new Set<string>(); // !important: internal cache that prevents building the same URLs

  /** Recursively build collection URLs */
  async function loadCollection(url: string): Promise<LoadResult | undefined> {
    if (builtURLs.has(url)) return; // this stops us from recursively building the same pages over and over
    const result = await runtime.load(url);
    builtURLs.add(url);
    if (result.statusCode === 200) {
      const outPath = path.posix.join('/', url, 'index.html');
      buildState[outPath] = {
        srcPath,
        contents: result.contents,
        contentType: 'text/html',
        encoding: 'utf8',
      };
    }
    return result;
  }

  const result = (await loadCollection(pagePath)) as LoadResult;

  if (result.statusCode >= 500) {
    throw new Error((result as any).error);
  }
  if (result.statusCode === 200 && !result.collectionInfo) {
    throw new Error(`[${rel}]: Collection page must export createCollection() function`);
  }

  // note: for pages that require params (/tag/:tag), we will get a 404 but will still get back collectionInfo that tell us what the URLs should be
  if (result.collectionInfo) {
    // build subsequent pages
    await Promise.all(
      [...result.collectionInfo.additionalURLs].map(async (url) => {
        // for the top set of additional URLs, we render every new URL generated
        const addlResult = await loadCollection(url);
        builtURLs.add(url);
        if (addlResult && addlResult.collectionInfo) {
          // believe it or not, we may still have a few unbuilt pages left. this is our last crawl:
          await Promise.all([...addlResult.collectionInfo.additionalURLs].map(async (url2) => loadCollection(url2)));
        }
      })
    );

    if (result.collectionInfo.rss) {
      if (!site) throw new Error(`[${rel}] createCollection() tried to generate RSS but "buildOptions.site" missing in astro.config.mjs`);
      const rss = generateRSS({ ...(result.collectionInfo.rss as any), site }, rel.replace(/\$([^.]+)\.astro$/, '$1'));
      const feedURL = path.posix.join('/feed', `${pagePath}.xml`);
      buildState[feedURL] = {
        srcPath,
        contents: rss,
        contentType: 'application/rss+xml',
        encoding: 'utf8',
      };
    }
  }
}

/** Build static page */
async function buildStaticPage({ astroRoot, buildState, filepath, runtime }: PageBuildOptions): Promise<void> {
  const rel = path.relative(fileURLToPath(astroRoot) + '/pages', fileURLToPath(filepath)); // pages/index.astro
  const pagePath = `/${rel.replace(/\.(astro|md)$/, '')}`;

  let relPath = path.posix.join('/', rel.replace(/\.(astro|md)$/, '.html'));
  if (!relPath.endsWith('index.html')) {
    relPath = relPath.replace(/\.html$/, '/index.html');
  }

  const srcPath = fileURLToPath(new URL('pages/' + rel, astroRoot));
  const result = await runtime.load(pagePath);

  if (result.statusCode === 200) {
    buildState[relPath] = {
      srcPath,
      contents: result.contents,
      contentType: 'text/html',
      encoding: 'utf8',
    };
  }
}

/** The primary build action */
export async function build(astroConfig: AstroConfig): Promise<0 | 1> {
  const { dist, projectRoot, astroRoot } = astroConfig;
  const pageRoot = new URL('./pages/', astroRoot);
  const buildState: BuildOutput = {};
  const depTree: BundleMap = {};

  const runtimeLogging: LogOptions = {
    level: 'error',
    dest: defaultLogDestination,
  };

  const mode: RuntimeMode = 'production';
  const runtime = await createRuntime(astroConfig, { mode, logging: runtimeLogging });
  const { runtimeConfig } = runtime;
  const { backendSnowpack: snowpack } = runtimeConfig;

  const pages = await allPages(pageRoot);
  const jsImports = new Set<string>();
  const finalURLs: string[] = [];

  // 0. erase build directory
  await del(fileURLToPath(new URL(dist, projectRoot)));

  /**
   * 1. Build Pages
   * Contents are built in parallel and stored in memory.
   * This is where we take the source code and transform it as we would in dev.
   */
  try {
    info(logging, 'build', yellow('! building pages...'));
    // Vue also console.warns, this silences it.
    const release = trapWarn();
    await Promise.all(
      pages.map(async (pathname) => {
        const filepath = new URL(`file://${pathname}`);
        const buildPage = getPageType(filepath) === 'collection' ? buildCollectionPage : buildStaticPage;

        // build page from source (can happen in parallel)
        const pagePromise = buildPage({
          astroRoot,
          buildState,
          filepath,
          runtime,
          site: astroConfig.buildOptions.site,
        });

        // collect runtime dependencies (Preact, Vue, etc.) from source (can happen in parallel)
        const runtimePromise = collectDynamicImports(filepath, {
          astroConfig,
          logging,
          resolvePackageUrl: (pkgName: string) => snowpack.getUrlForPackage(pkgName),
          mode,
        }).then((imports) =>
          Promise.all(
            [...imports].map(async (url) => {
              jsImports.add(url);
              // we’ve collected the imports, but now we need to do something with them! add them to the buildState.
              // note: this is inside .then(), and can still be happening if page is still being built

              // don’t end up in an infinite loop building same URLs over and over
              const alreadyBuilt = buildState[url];
              if (alreadyBuilt) return;

              // add new results to buildState
              const result = await runtime.load(url);
              if (result.statusCode === 200) {
                buildState[url] = {
                  srcPath: pathname,
                  contents: result.contents,
                  contentType: result.contentType || mime.getType(url) || '',
                  encoding: 'utf8',
                };
              }
            })
          )
        );

        // wait for both to finish
        await pagePromise;
        await runtimePromise;
      })
    );

    info(logging, 'build', green('✔'), 'pages built.');
    release();
  } catch (err) {
    error(logging, 'generate', err);
    await runtime.shutdown();
    return 1;
  }

  // generate finalURLs
  for (const [id, buildResult] of Object.entries(buildState)) {
    if (buildResult.contentType !== 'text/html' || id.endsWith('/1/index.html')) continue; // note: exclude auto-generated "page 1" pages
    finalURLs.push(id.replace(/index\.html$/, ''));
  }
  finalURLs.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

  // generate Sitemap from pages (even though we haven’t bundled all files, we know all URLs now)
  if (astroConfig.buildOptions.sitemap && astroConfig.buildOptions.site) {
    info(logging, 'build', yellow('! creating sitemap...'));
    // TODO: find way to get canonical URLs
    // TODO: find way to exclude pages from sitemap (or rely on robots.txt?)
    const canonicalURLs = finalURLs.map((url) => canonicalURL(url, astroConfig.buildOptions.site));
    const sitemap = generateSitemap(canonicalURLs);
    const sitemapURL = new URL(path.posix.join('/', dist, 'sitemap.xml'), projectRoot);
    await fs.promises.writeFile(sitemapURL, sitemap, 'utf8');
    info(logging, 'build', green('✔'), 'sitemap built.');
  } else if (astroConfig.buildOptions.sitemap) {
    info(logging, 'tip', `Set "buildOptions.site" in astro.config.mjs to generate a sitemap.xml, or set "buildOptions.sitemap: false" to disable this message.`);
  }

  /**
   * 2. Bundle
   * This is where we scan HTML and build our dependency graph for bundling.
   * As we encounter assets that need bundling, we’ll update the URLs where necessary.
   * Also it’s worth noting that some Astro component CSS hasn’t been built yet,
   * but we needed the previous step to finish, and we can discover what’s unbuilt
   * in the same pass as optimizing the dep tree.
   */
  info(logging, 'build', yellow('! optimizing build...'));

  // build dependency map
  const scanPromises: Promise<void>[] = [];
  for (const key of Object.keys(buildState)) {
    if (buildState[key].contentType !== 'text/html') continue; // only scan HTML files
    const pageDeps = scanHTML(buildState[key].contents as string, { cwd: path.posix.dirname(key) });
    depTree[key] = pageDeps;

    // while scanning we will find some unbuilt files; make sure those are all built while scanning
    for (const url of [...pageDeps.js, ...pageDeps.css, ...pageDeps.images]) {
      if (!buildState[url])
        scanPromises.push(
          runtime.load(url).then((result) => {
            if (result.statusCode !== 200) {
              throw new Error((result as any).error); // there shouldn’t be a build error here
            }
            buildState[url] = {
              srcPath: url,
              contents: result.contents,
              contentType: result.contentType || mime.getType(url) || '',
            };
          })
        );
    }
  }
  await Promise.all(scanPromises);

  // bundle! ✨
  await Promise.all([
    // bundleJS(jsImports, { dist: new URL(dist + '/', projectRoot), runtime, astroConfig }),
    bundleCSS({ buildState, depTree }),
    // TODO: optimize images
  ]);
  // TODO: minify HTML? (should probably wait until after HTML is being rewritten)
  info(logging, 'build', green('✔'), 'pages optimized.');

  // important: collect stats output before memory is wiped
  const urlStats = await collectBundleStats(buildState, depTree);

  /**
   * 3. Write to disk
   * Also clear in-memory bundle
   */
  await Promise.all(
    Object.entries(buildState).map(async ([id, buildFile]) => {
      let contents = buildFile.contents;

      if (buildFile.contentType === 'text/html') {
        // TODO: remove duplicate <link> and <script> tags created through bundling
      }

      // write to disk, and free up precious memory
      const outPath = new URL(path.posix.join(dist, id), projectRoot);
      await fs.promises.mkdir(path.dirname(fileURLToPath(outPath)), { recursive: true });
      await fs.promises.writeFile(outPath, contents, buildFile.encoding);
      delete buildState[id];
      delete depTree[id];
    })
  );

  /**
   * 4. Copy Assets
   */
  if (fs.existsSync(astroConfig.public)) {
    info(logging, 'build', yellow(`! copying public folder...`));
    const pub = astroConfig.public;
    const publicFiles = (await new fdir().withFullPaths().crawl(fileURLToPath(pub)).withPromise()) as string[];
    await Promise.all(
      publicFiles.map(async (filepath) => {
        const fileUrl = new URL(`file://${filepath}`);
        const rel = path.relative(fileURLToPath(pub), fileURLToPath(fileUrl));
        const outPath = new URL(path.join('.', dist, rel), projectRoot);
        await fs.promises.mkdir(path.dirname(fileURLToPath(outPath)), { recursive: true });
        await fs.promises.copyFile(fileUrl, outPath); // we don’t need these files in memory
      })
    );
    info(logging, 'build', green('✔'), 'public folder copied.');
  } else {
    if (path.basename(astroConfig.public.toString()) !== 'public') {
      info(logging, 'tip', yellow(`! no public folder ${astroConfig.public} found...`));
    }
  }

  /**
   * 5. Output stats
   */
  logURLStats(logging, urlStats, finalURLs);

  await runtime.shutdown();
  info(logging, 'build', bold(green('▶ Build Complete!')));
  return 0;
}

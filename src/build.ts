import type { AstroConfig, RuntimeMode } from './@types/astro';
import type { LogOptions } from './logger';
import type { AstroRuntime, LoadResult } from './runtime';

import { existsSync, promises as fsPromises } from 'fs';
import { bold, green, yellow, underline } from 'kleur/colors';
import path from 'path';
import cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import { fdir } from 'fdir';
import { defaultLogDestination, error, info, trapWarn } from './logger.js';
import { createRuntime } from './runtime.js';
import { bundle, collectDynamicImports } from './build/bundle.js';
import { generateRSS } from './build/rss.js';
import { generateSitemap } from './build/sitemap.js';
import { collectStatics } from './build/static.js';
import { canonicalURL } from './build/util.js';


const { mkdir, readFile, writeFile } = fsPromises;

interface PageBuildOptions {
  astroRoot: URL;
  dist: URL;
  filepath: URL;
  runtime: AstroRuntime;
  site?: string;
  sitemap: boolean;
  statics: Set<string>;
}

interface PageResult {
  canonicalURLs: string[];
  rss?: string;
  statusCode: number;
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

/** Utility for merging two Set()s */
function mergeSet(a: Set<string>, b: Set<string>) {
  for (let str of b) {
    a.add(str);
  }
  return a;
}

/** Utility for writing to file (async) */
async function writeFilep(outPath: URL, bytes: string | Buffer, encoding: 'utf8' | null) {
  const outFolder = new URL('./', outPath);
  await mkdir(outFolder, { recursive: true });
  await writeFile(outPath, bytes, encoding || 'binary');
}

/** Utility for writing a build result to disk */
async function writeResult(result: LoadResult, outPath: URL, encoding: null | 'utf8') {
  if (result.statusCode === 500 || result.statusCode === 404) {
    error(logging, 'build', result.error || result.statusCode);
  } else if (result.statusCode !== 200) {
    error(logging, 'build', `Unexpected load result (${result.statusCode}) for ${fileURLToPath(outPath)}`);
  } else {
    const bytes = result.contents;
    await writeFilep(outPath, bytes, encoding);
  }
}

/** Collection utility */
function getPageType(filepath: URL): 'collection' | 'static' {
  if (/\$[^.]+.astro$/.test(filepath.pathname)) return 'collection';
  return 'static';
}

/** Build collection */
async function buildCollectionPage({ astroRoot, dist, filepath, runtime, site, statics }: PageBuildOptions): Promise<PageResult> {
  const rel = path.relative(fileURLToPath(astroRoot) + '/pages', fileURLToPath(filepath)); // pages/index.astro
  const pagePath = `/${rel.replace(/\$([^.]+)\.astro$/, '$1')}`;
  const builtURLs = new Set<string>(); // !important: internal cache that prevents building the same URLs

  /** Recursively build collection URLs */
  async function loadCollection(url: string): Promise<LoadResult | undefined> {
    if (builtURLs.has(url)) return; // this stops us from recursively building the same pages over and over
    const result = await runtime.load(url);
    builtURLs.add(url);
    if (result.statusCode === 200) {
      const outPath = new URL('./' + url + '/index.html', dist);
      await writeResult(result, outPath, 'utf8');
      mergeSet(statics, collectStatics(result.contents.toString('utf8')));
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

  let rss: string | undefined;

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
      rss = generateRSS({ ...(result.collectionInfo.rss as any), site }, rel.replace(/\$([^.]+)\.astro$/, '$1'));
    }
  }

  return {
    canonicalURLs: [...builtURLs].filter((url) => !url.endsWith('/1')), // note: canonical URLs are controlled by the collection, so these are canonical (but exclude "/1" pages as those are duplicates of the index)
    statusCode: result.statusCode,
    rss,
  };
}

/** Build static page */
async function buildStaticPage({ astroRoot, dist, filepath, runtime, sitemap, statics }: PageBuildOptions): Promise<PageResult> {
  const rel = path.relative(fileURLToPath(astroRoot) + '/pages', fileURLToPath(filepath)); // pages/index.astro
  const pagePath = `/${rel.replace(/\.(astro|md)$/, '')}`;
  let canonicalURLs: string[] = [];

  let relPath = './' + rel.replace(/\.(astro|md)$/, '.html');
  if (!relPath.endsWith('index.html')) {
    relPath = relPath.replace(/\.html$/, '/index.html');
  }

  const outPath = new URL(relPath, dist);
  const result = await runtime.load(pagePath);

  await writeResult(result, outPath, 'utf8');

  if (result.statusCode === 200) {
    mergeSet(statics, collectStatics(result.contents.toString('utf8')));

    // get Canonical URL (if user has specified one manually, use that)
    if (sitemap) {
      const $ = cheerio.load(result.contents);
      const canonicalTag = $('link[rel="canonical"]');
      canonicalURLs.push(canonicalTag.attr('href') || pagePath.replace(/index$/, ''));
    }
  }

  return {
    canonicalURLs,
    statusCode: result.statusCode,
  };
}

/** The primary build action */
export async function build(astroConfig: AstroConfig): Promise<0 | 1> {
  const { projectRoot, astroRoot } = astroConfig;
  const pageRoot = new URL('./pages/', astroRoot);
  const componentRoot = new URL('./components/', astroRoot);
  const dist = new URL(astroConfig.dist + '/', projectRoot);

  const runtimeLogging: LogOptions = {
    level: 'error',
    dest: defaultLogDestination,
  };

  const mode: RuntimeMode = 'production';
  const runtime = await createRuntime(astroConfig, { mode, logging: runtimeLogging });
  const { runtimeConfig } = runtime;
  const { backendSnowpack: snowpack } = runtimeConfig;
  const resolvePackageUrl = (pkgName: string) => snowpack.getUrlForPackage(pkgName);

  const imports = new Set<string>();
  const statics = new Set<string>();
  const collectImportsOptions = { astroConfig, logging, resolvePackageUrl, mode };

  const pages = await allPages(pageRoot);
  let builtURLs: string[] = [];


  try {
    info(logging , 'build', yellow('! building pages...'));
    // Vue also console.warns, this silences it.
    const release = trapWarn();
    await Promise.all(
      pages.map(async (pathname) => {
        const filepath = new URL(`file://${pathname}`);

        const pageType = getPageType(filepath);
        const pageOptions: PageBuildOptions = { astroRoot, dist, filepath, runtime, site: astroConfig.buildOptions.site, sitemap: astroConfig.buildOptions.sitemap, statics };
        if (pageType === 'collection') {
          const { canonicalURLs, rss } = await buildCollectionPage(pageOptions);
          builtURLs.push(...canonicalURLs);
          if (rss) {
            const basename = path
              .relative(fileURLToPath(astroRoot) + '/pages', pathname)
              .replace(/^\$/, '')
              .replace(/\.astro$/, '');
            await writeFilep(new URL(`file://${path.join(fileURLToPath(dist), 'feed', basename + '.xml')}`), rss, 'utf8');
          }
        } else {
          const { canonicalURLs } = await buildStaticPage(pageOptions);
          builtURLs.push(...canonicalURLs);
        }

        mergeSet(imports, await collectDynamicImports(filepath, collectImportsOptions));
      })
    );
    info(logging, 'build', green('✔'), 'pages built.');
    release();
  } catch (err) {
    error(logging, 'generate', err);
    await runtime.shutdown();
    return 1;
  }

  info(logging, 'build', yellow('! scanning pages...'));
  for (const pathname of await allPages(componentRoot)) {
    mergeSet(imports, await collectDynamicImports(new URL(`file://${pathname}`), collectImportsOptions));
  }
  info(logging, 'build', green('✔'), 'pages scanned.');

  if (imports.size > 0) {
    try {
      info(logging, 'build', yellow('! bundling client-side code.'));
      await bundle(imports, { dist, runtime, astroConfig });
      info(logging, 'build', green('✔'), 'bundling complete.');
    } catch (err) {
      error(logging, 'build', err);
      await runtime.shutdown();
      return 1;
    }
  }

  for (let url of statics) {
    const outPath = new URL('.' + url, dist);
    const result = await runtime.load(url);

    await writeResult(result, outPath, null);
  }

  if (existsSync(astroConfig.public)) {
    info(logging, 'build', yellow(`! copying public folder...`));
    const pub = astroConfig.public;
    const publicFiles = (await new fdir().withFullPaths().crawl(fileURLToPath(pub)).withPromise()) as string[];
    for (const filepath of publicFiles) {
      const fileUrl = new URL(`file://${filepath}`);
      const rel = path.relative(pub.pathname, fileUrl.pathname);
      const outUrl = new URL('./' + rel, dist);

      const bytes = await readFile(fileUrl);
      await writeFilep(outUrl, bytes, null);
    }
    info(logging, 'build', green('✔'), 'public folder copied.');
  }

  // build sitemap
  if (astroConfig.buildOptions.sitemap && astroConfig.buildOptions.site) {
    info(logging, 'build', yellow('! creating a sitemap...'));
    const sitemap = generateSitemap(builtURLs.map((url) => ({ canonicalURL: canonicalURL(url, astroConfig.buildOptions.site) })));
    await writeFile(new URL('./sitemap.xml', dist), sitemap, 'utf8');
    info(logging, 'build', green('✔'), 'sitemap built.');
  } else if (astroConfig.buildOptions.sitemap) {
    info(logging, 'tip', `Set "buildOptions.site" in astro.config.mjs to generate a sitemap.xml`);
  }

  builtURLs.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  info(logging, 'build', underline('Pages'));
  const lastIndex = builtURLs.length - 1;
  builtURLs.forEach((url, index) => {
    const sep = index === 0 ? '┌' : index === lastIndex ? '└' : '├';
    info(logging, null, ' ' + sep, url === '/' ? url : url + '/');
  });

  await runtime.shutdown();
  info(logging, 'build', bold(green('▶ Build Complete!')));
  return 0;
}

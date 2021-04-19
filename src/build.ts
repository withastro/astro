import type { AstroConfig, RuntimeMode } from './@types/astro';
import type { LogOptions } from './logger';
import type { AstroRuntime, LoadResult } from './runtime';

import { existsSync, promises as fsPromises } from 'fs';
import { relative as pathRelative } from 'path';
import { fileURLToPath } from 'url';
import { fdir } from 'fdir';
import { defaultLogDestination, error } from './logger.js';
import { createRuntime } from './runtime.js';
import { bundle, collectDynamicImports } from './build/bundle.js';
import { collectStatics } from './build/static.js';

const { mkdir, readdir, readFile, stat, writeFile } = fsPromises;

interface PageBuildOptions {
  astroRoot: URL;
  dist: URL;
  filepath: URL;
  runtime: AstroRuntime;
  statics: Set<string>;
}

interface PageResult {
  statusCode: number;
}

const logging: LogOptions = {
  level: 'debug',
  dest: defaultLogDestination,
};

/** Return contents of astro/pages */
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
async function writeFilep(outPath: URL, bytes: string | Buffer, encoding: 'utf-8' | null) {
  const outFolder = new URL('./', outPath);
  await mkdir(outFolder, { recursive: true });
  await writeFile(outPath, bytes, encoding || 'binary');
}

/** Utility for writing a build result to disk */
async function writeResult(result: LoadResult, outPath: URL, encoding: null | 'utf-8') {
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
async function buildCollectionPage({ astroRoot, dist, filepath, runtime, statics }: PageBuildOptions): Promise<PageResult> {
  const rel = pathRelative(fileURLToPath(astroRoot) + '/pages', fileURLToPath(filepath)); // pages/index.astro
  const pagePath = `/${rel.replace(/\$([^.]+)\.astro$/, '$1')}`;
  const builtURLs = new Set<string>(); // !important: internal cache that prevents building the same URLs

  /** Recursively build collection URLs */
  async function loadCollection(url: string): Promise<LoadResult | undefined> {
    if (builtURLs.has(url)) return; // this stops us from recursively building the same pages over and over
    const result = await runtime.load(url);
    builtURLs.add(url);
    if (result.statusCode === 200) {
      const outPath = new URL('./' + url + '/index.html', dist);
      await writeResult(result, outPath, 'utf-8');
      mergeSet(statics, collectStatics(result.contents.toString('utf-8')));
    }
    return result;
  }

  const result = (await loadCollection(pagePath)) as LoadResult;
  if (result.statusCode === 200 && !result.collectionInfo) {
    throw new Error(`[${rel}]: Collection page must export createCollection() function`);
  }

  // note: for pages that require params (/tag/:tag), we will get a 404 but will still get back collectionInfo that tell us what the URLs should be
  if (result.collectionInfo) {
    await Promise.all(
      [...result.collectionInfo.additionalURLs].map(async (url) => {
        // for the top set of additional URLs, we render every new URL generated
        const addlResult = await loadCollection(url);
        if (addlResult && addlResult.collectionInfo) {
          // believe it or not, we may still have a few unbuilt pages left. this is our last crawl:
          await Promise.all([...addlResult.collectionInfo.additionalURLs].map(async (url2) => loadCollection(url2)));
        }
      })
    );
  }

  return {
    statusCode: result.statusCode,
  };
}

/** Build static page */
async function buildStaticPage({ astroRoot, dist, filepath, runtime, statics }: PageBuildOptions): Promise<PageResult> {
  const rel = pathRelative(fileURLToPath(astroRoot) + '/pages', fileURLToPath(filepath)); // pages/index.astro
  const pagePath = `/${rel.replace(/\.(astro|md)$/, '')}`;

  let relPath = './' + rel.replace(/\.(astro|md)$/, '.html');
  if (!relPath.endsWith('index.html')) {
    relPath = relPath.replace(/\.html$/, '/index.html');
  }

  const outPath = new URL(relPath, dist);
  const result = await runtime.load(pagePath);

  await writeResult(result, outPath, 'utf-8');
  if (result.statusCode === 200) {
    mergeSet(statics, collectStatics(result.contents.toString('utf-8')));
  }

  return {
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

  try {
    await Promise.all(
      pages.map(async (pathname) => {
        const filepath = new URL(`file://${pathname}`);

        const pageType = getPageType(filepath);
        const pageOptions: PageBuildOptions = { astroRoot, dist, filepath, runtime, statics };
        if (pageType === 'collection') {
          await buildCollectionPage(pageOptions);
        } else {
          await buildStaticPage(pageOptions);
        }

        mergeSet(imports, await collectDynamicImports(filepath, collectImportsOptions));
      })
    );
  } catch (err) {
    error(logging, 'generate', err);
    await runtime.shutdown();
    return 1;
  }

  for (const pathname of await allPages(componentRoot)) {
    mergeSet(imports, await collectDynamicImports(new URL(`file://${pathname}`), collectImportsOptions));
  }

  if (imports.size > 0) {
    try {
      await bundle(imports, { dist, runtime, astroConfig });
    } catch(err) {
      error(logging, 'generate', err);
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
    const pub = astroConfig.public;
    const publicFiles = (await new fdir().withFullPaths().crawl(fileURLToPath(pub)).withPromise()) as string[];
    for (const filepath of publicFiles) {
      const fileUrl = new URL(`file://${filepath}`);
      const rel = pathRelative(pub.pathname, fileUrl.pathname);
      const outUrl = new URL('./' + rel, dist);

      const bytes = await readFile(fileUrl);
      await writeFilep(outUrl, bytes, null);
    }
  }

  await runtime.shutdown();
  return 0;
}

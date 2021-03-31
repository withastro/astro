import type { AstroConfig } from './@types/astro';
import type { LogOptions } from './logger';
import type { LoadResult } from './runtime';

import { existsSync, promises as fsPromises } from 'fs';
import { relative as pathRelative } from 'path';
import { fdir } from 'fdir';
import { defaultLogDestination, error } from './logger.js';
import { createRuntime } from './runtime.js';
import { bundle, collectDynamicImports } from './build/bundle.js';
import { collectStatics } from './build/static.js';

const { mkdir, readdir, readFile, stat, writeFile } = fsPromises;

const logging: LogOptions = {
  level: 'debug',
  dest: defaultLogDestination,
};

async function allPages(root: URL) {
  const api = new fdir()
    .filter((p) => /\.(astro|md)$/.test(p))
    .withFullPaths()
    .crawl(root.pathname);
  const files = await api.withPromise();
  return files as string[];
}

function mergeSet(a: Set<string>, b: Set<string>) {
  for (let str of b) {
    a.add(str);
  }
  return a;
}

async function writeFilep(outPath: URL, bytes: string | Buffer, encoding: 'utf-8' | null) {
  const outFolder = new URL('./', outPath);
  await mkdir(outFolder, { recursive: true });
  await writeFile(outPath, bytes, encoding || 'binary');
}

async function writeResult(result: LoadResult, outPath: URL, encoding: null | 'utf-8') {
  if (result.statusCode !== 200) {
    error(logging, 'build', result.error || result.statusCode);
    //return 1;
  } else {
    const bytes = result.contents;
    await writeFilep(outPath, bytes, encoding);
  }
}

export async function build(astroConfig: AstroConfig): Promise<0 | 1> {
  const { projectRoot, astroRoot } = astroConfig;
  const pageRoot = new URL('./pages/', astroRoot);
  const dist = new URL(astroConfig.dist + '/', projectRoot);

  const runtimeLogging: LogOptions = {
    level: 'error',
    dest: defaultLogDestination,
  };

  const runtime = await createRuntime(astroConfig, { logging: runtimeLogging });
  const { runtimeConfig } = runtime;
  const { snowpack } = runtimeConfig;
  const resolve = (pkgName: string) => snowpack.getUrlForPackage(pkgName);

  const imports = new Set<string>();
  const statics = new Set<string>();

  for (const pathname of await allPages(pageRoot)) {
    const filepath = new URL(`file://${pathname}`);
    const rel = pathRelative(astroRoot.pathname + '/pages', filepath.pathname); // pages/index.astro
    const pagePath = `/${rel.replace(/\.(astro|md)/, '')}`;

    try {
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
    } catch (err) {
      error(logging, 'generate', err);
      return 1;
    }

    mergeSet(imports, await collectDynamicImports(filepath, astroConfig, resolve));
  }

  await bundle(imports, { dist, runtime, astroConfig });

  for (let url of statics) {
    const outPath = new URL('.' + url, dist);
    const result = await runtime.load(url);

    await writeResult(result, outPath, null);
  }

  if (existsSync(astroConfig.public)) {
    const pub = astroConfig.public;
    const publicFiles = (await new fdir().withFullPaths().crawl(pub.pathname).withPromise()) as string[];
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

import type { AstroConfig } from './@types/astro';
import type { LogOptions } from './logger';
import type { LoadResult } from './runtime';

import { promises as fsPromises } from 'fs';
import { relative as pathRelative } from 'path';
import { defaultLogDestination, error } from './logger.js';
import { createRuntime } from './runtime.js';
import { bundle, collectDynamicImports } from './build/bundle.js';
import { collectStatics } from './build/static.js';

const { mkdir, readdir, readFile, stat, writeFile } = fsPromises;

const logging: LogOptions = {
  level: 'debug',
  dest: defaultLogDestination,
};

async function* recurseFiles(root: URL): AsyncGenerator<URL, void, unknown> {
  for (const filename of await readdir(root)) {
    const fullpath = new URL(filename, root);
    const info = await stat(fullpath);

    if (info.isDirectory()) {
      yield* recurseFiles(new URL(fullpath + '/'));
    } else {
      yield fullpath;
    }
  }
}

async function* allPages(root: URL): AsyncGenerator<URL, void, unknown> {
  for await(const filename of recurseFiles(root)) {
    if(/\.(astro|md)$/.test(filename.pathname)) {
      yield filename;
    }
  }
}

function mergeSet(a: Set<string>, b: Set<string>) {
  for(let str of b) {
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
  if(result.statusCode !== 200) {
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
  const resolve = (pkgName: string) => snowpack.getUrlForPackage(pkgName)

  const imports = new Set<string>();
  const statics = new Set<string>();

  for await (const filepath of allPages(pageRoot)) {
    const rel = pathRelative(astroRoot.pathname + '/pages', filepath.pathname); // pages/index.astro
    const pagePath = `/${rel.replace(/\.(astro|md)/, '')}`;

    try {
      const outPath = new URL('./' + rel.replace(/\.(astro|md)/, '.html'), dist);
      const result = await runtime.load(pagePath);

      await writeResult(result, outPath, 'utf-8');
      if(result.statusCode === 200) {
        mergeSet(statics, collectStatics(result.contents.toString('utf-8')));
      }
    } catch (err) {
      error(logging, 'generate', err);
      return 1;
    }

    mergeSet(imports, await collectDynamicImports(filepath, astroConfig, resolve));
  }

  await bundle(imports, {dist, runtime, astroConfig});

  for(let url of statics) {
    const outPath = new URL('.' + url, dist);
    const result = await runtime.load(url);

    await writeResult(result, outPath, null);
  }

  if(astroConfig.public) {
    const pub = astroConfig.public;
    for await(const filename of recurseFiles(pub)) {
      const rel = pathRelative(pub.pathname, filename.pathname);
      const outUrl = new URL('./' + rel, dist);

      const bytes = await readFile(filename);
      await writeFilep(outUrl, bytes, null);
    }
  }

  await runtime.shutdown();
  return 0;
}

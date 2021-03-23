import type { AstroConfig } from './@types/astro';
import { defaultLogOptions, LogOptions } from './logger';

import {
  loadConfiguration,
  startServer as startSnowpackServer,
  build as snowpackBuild } from 'snowpack';
import { promises as fsPromises } from 'fs';
import { relative as pathRelative } from 'path';
import { defaultLogDestination, error } from './logger.js';
import { createRuntime } from './runtime.js';

const { mkdir, readdir, stat, writeFile } = fsPromises;

const logging: LogOptions = {
  level: 'debug',
  dest: defaultLogDestination,
};

async function* allPages(root: URL): AsyncGenerator<URL, void, unknown> {
  for (const filename of await readdir(root)) {
    const fullpath = new URL(filename, root);
    const info = await stat(fullpath);

    if (info.isDirectory()) {
      yield* allPages(new URL(fullpath + '/'));
    } else {
      if(/\.(astro|md)$/.test(fullpath.pathname)) {
        yield fullpath;
      }
    }
  }
}

export async function build(astroConfig: AstroConfig): Promise<0 | 1> {
  const { projectRoot, astroRoot } = astroConfig;
  const pageRoot = new URL('./pages/', astroRoot);
  const dist = new URL(astroConfig.dist + '/', projectRoot);

  const runtimeLogging: LogOptions = {
    level: 'error',
    dest: defaultLogDestination
  };

  const runtime = await createRuntime(astroConfig, { logging: runtimeLogging, env: 'build' });
  const { snowpackConfig } = runtime.runtimeConfig;

  try {
    const result = await snowpackBuild({
      config: snowpackConfig,
      lockfile: null
    });

  } catch(err) {
    error(logging, 'build', err);
    return 1;
  }

  for await (const filepath of allPages(pageRoot)) {
    const rel = pathRelative(astroRoot.pathname + '/pages', filepath.pathname); // pages/index.astro
    const pagePath = `/${rel.replace(/\.(astro|md)/, '')}`;

    try {
      const outPath = new URL('./' + rel.replace(/\.(astro|md)/, '.html'), dist);
      const outFolder = new URL('./', outPath);
      const result = await runtime.load(pagePath);
      
      if(result.statusCode !== 200) {
        error(logging, 'generate', result.error || result.statusCode);
        //return 1;
      } else {
        await mkdir(outFolder, { recursive: true });
        await writeFile(outPath, result.contents, 'utf-8');
      }
    } catch (err) {
      error(logging, 'generate', err);
      return 1;
    }
  }

  await runtime.shutdown();
  return 0;
}
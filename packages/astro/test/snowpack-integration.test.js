import { fileURLToPath } from 'url';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { createRuntime } from '#astro/runtime';
import { loadConfig } from '#astro/config';
import { promises as fsPromises } from 'fs';
import { relative as pathRelative } from 'path';

const { readdir, stat } = fsPromises;

const SnowpackDev = suite('snowpack.dev');

let runtime, cwd, setupError;

SnowpackDev.before(async () => {
  // Bug: Snowpack config is still loaded relative to the current working directory.
  cwd = process.cwd();
  process.chdir(fileURLToPath(new URL('../examples/snowpack/', import.meta.url)));

  const astroConfig = await loadConfig(fileURLToPath(new URL('../examples/snowpack', import.meta.url)));

  const logging = {
    level: 'error',
    dest: process.stderr,
  };

  try {
    runtime = await createRuntime(astroConfig, { logging });
  } catch (err) {
    console.error(err);
    setupError = err;
  }
});

SnowpackDev.after(async () => {
  process.chdir(cwd);
  (await runtime) && runtime.shutdown();
});
/** create an iterator for all page files */
async function* allPageFiles(root) {
  for (const filename of await readdir(root)) {
    const fullpath = new URL(filename, root);
    const info = await stat(fullpath);

    if (info.isDirectory()) {
      yield* allPageFiles(new URL(fullpath + '/'));
    } else {
      yield fullpath;
    }
  }
}
/** create an iterator for all pages and yield the relative paths */
async function* allPages(root) {
  for await (let fileURL of allPageFiles(root)) {
    let bare = fileURLToPath(fileURL)
      .replace(/\.(astro|md)$/, '')
      .replace(/index$/, '');

    yield '/' + pathRelative(fileURLToPath(root), bare);
  }
}

SnowpackDev('No error creating the runtime', () => {
  assert.equal(setupError, undefined);
});

SnowpackDev('Can load every page', async () => {
  const failed = [];

  const pageRoot = new URL('../examples/snowpack/src/pages/', import.meta.url);
  for await (let pathname of allPages(pageRoot)) {
    if (pathname.includes('proof-of-concept-dynamic')) {
      continue;
    }
    const result = await runtime.load(pathname);
    if (result.statusCode === 500) {
      failed.push({ ...result, pathname });
      continue;
    }
    assert.equal(result.statusCode, 200, `Loading ${pathname}`);
  }

  if (failed.length > 0) {
    console.error(failed);
  }
  assert.equal(failed.length, 0, 'Failed pages');
});

SnowpackDev.run();

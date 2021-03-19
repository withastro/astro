import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { createRuntime } from '../lib/runtime.js';
import { promises as fsPromises } from 'fs';
import { relative as pathRelative } from 'path';
import { doc } from './test-utils.js';

const { readdir, stat } = fsPromises;

const SnowpackDev = suite('snowpack.dev');

let runtime;

SnowpackDev.before(async () => {
  const astroConfig = {
    projectRoot: new URL('../examples/snowpack/', import.meta.url),
    hmxRoot: new URL('../examples/snowpack/astro/', import.meta.url),
    dist: './_site'
  };
  
  const logging = {
    level: 'error',
    dest: process.stderr
  };

  runtime = await createRuntime(astroConfig, logging);
});

SnowpackDev.after(async () => {
  await runtime.shutdown();
});

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

async function* allPages(root) {
  for await(let fileURL of allPageFiles(root)) {
    let bare = fileURL.pathname
      .replace(/\.(hmx|md)$/, '')
      .replace(/index$/, '')

    yield '/' + pathRelative(root.pathname, bare);
  }
}

SnowpackDev.skip('Can load every page', async () => {
  const failed = [];

  const pageRoot = new URL('../examples/snowpack/astro/pages/', import.meta.url);
  for await(let pathname of allPages(pageRoot)) {
    const result = await runtime.load(pathname);
    if(result.statusCode === 500) {
      failed.push(result);
      continue;
    }
    assert.equal(result.statusCode, 200, `Loading ${pathname}`);
  }

  assert.equal(failed.length, 0, 'Failed pages');
  console.log(failed);
});

SnowpackDev.run();
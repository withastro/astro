import path from 'path';
import glob from 'tiny-glob/sync.js';
import { fileURLToPath } from 'url';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { setup } from './helpers.js';

const SnowpackDev = suite('docs.astro.build');
setup(SnowpackDev, '../../../docs');

// convert file path to its final url
function formatURL(filepath) {
  return filepath
    .replace(/^\/?/, '/') // add / to beginning, if missing
    .replace(/(index)?\.(astro|md)$/, '') // remove .astro and .md extensions
    .replace(/\/$/, ''); // remove trailing slash, if any
}

// declaring routes individually helps us run many quick tests rather than one giant slow test
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../docs/src/pages');
let pages = glob('**/*.{astro,md}', { cwd: root, onlyFiles: true })
  .map(formatURL);

SnowpackDev('Pages successfully scanned', () => {
  assert.ok(pages.length > 0);
});

for (const pathname of pages) {
  SnowpackDev(`Loads "${pathname}"`, async ({ runtime }) => {
    const result = await runtime.load(pathname);
    if (result.statusCode !== 200) {
      console.error(result);
    }
    assert.equal(result.statusCode, 200);
    return;
  });
}


// Skipped on Node <v14
if (process.env.NODE_VERSION > '14') {
  SnowpackDev.run();
}
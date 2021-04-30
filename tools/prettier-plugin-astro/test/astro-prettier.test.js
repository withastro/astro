import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { format } from './test-utils.js';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url'
const Prettier = suite('Prettier formatting');

const readFile = (path) => fs.readFile(fileURLToPath(new URL(`./fixtures${path}`, import.meta.url))).then(res => res.toString())

/**
 * Utility to get `[src, out]` files
 * @param name {string}
 * @param ctx {any}
 */
const getFiles = async (name) => {
  const [src, out] = await Promise.all([readFile(`/in/${name}.astro`), readFile(`/out/${name}.astro`)]);
  return [src, out];
};

Prettier('can format a basic Astro file', async () => {
  const [src, out] = await getFiles('basic');
  assert.not.equal(src, out);

  const formatted = format(src);
  assert.equal(formatted, out);
});

Prettier('can format an Astro file with frontmatter', async () => {
  const [src, out] = await getFiles('frontmatter');
  assert.not.equal(src, out);

  const formatted = format(src);
  assert.equal(formatted, out);
});

Prettier('can format an Astro file with embedded JSX expressions', async () => {
  const [src, out] = await getFiles('embedded-expr');
  assert.not.equal(src, out);

  const formatted = format(src);
  assert.equal(formatted, out);
});

Prettier.run();

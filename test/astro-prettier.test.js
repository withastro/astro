import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { format } from './test-utils.js';
import { setup } from './helpers.js';

const Prettier = suite('Prettier formatting');

setup(Prettier, './fixtures/astro-prettier');

/**
 * Utility to get `[src, out]` files
 * @param name {string}
 * @param ctx {any}
 */
const getFiles = async (name, { readFile }) => {
  const [src, out] = await Promise.all([readFile(`/in/${name}.astro`), readFile(`/out/${name}.astro`)]);
  return [src, out];
};

Prettier('can format a basic Astro file', async (ctx) => {
  const [src, out] = await getFiles('basic', ctx);
  assert.not.equal(src, out);

  const formatted = format(src);
  assert.equal(formatted, out);
});

Prettier('can format an Astro file with frontmatter', async (ctx) => {
  const [src, out] = await getFiles('frontmatter', ctx);
  assert.not.equal(src, out);

  const formatted = format(src);
  assert.equal(formatted, out);
});

Prettier('can format an Astro file with embedded JSX expressions', async (ctx) => {
  const [src, out] = await getFiles('embedded-expr', ctx);
  assert.not.equal(src, out);

  const formatted = format(src);
  assert.equal(formatted, out);
});

Prettier.run();

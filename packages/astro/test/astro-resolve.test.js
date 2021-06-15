import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { setupBuild } from './helpers.js';

const Resolution = suite('Astro Resolution');

setupBuild(Resolution, './fixtures/astro-resolve');

Resolution('Assets', async (context) => {
  await context.build();

  // public/ asset resolved
  assert.ok(await context.readFile('/svg.svg'));

  // asset in src/pages resolved (and didn’t overwrite /svg.svg)
  assert.ok(await context.readFile('/_astro/src/pages/svg.svg'));
});

Resolution.run();

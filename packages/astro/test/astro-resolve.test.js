import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setupBuild } from './helpers.js';

const Resolution = suite('Astro Resolution');

setupBuild(Resolution, './fixtures/astro-resolve');

Resolution('Assets', async (context) => {
  await context.build();

  // test 1: public/ asset resolved
  assert.ok(await context.readFile('/svg.svg'));

  // test 2: asset in src/pages resolved (and didn’t overwrite /svg.svg)
  assert.ok(await context.readFile('/_astro/src/pages/svg.svg'));
});

Resolution('<script type="module">', async (context) => {
  await context.build();

  // public/ asset resolved
  const $ = doc(await context.readFile('/scripts/index.html'));

  // test 1: not `type="module"` left alone
  assert.equal($('script[src="./relative.js"]').attr('type'), undefined);

  // test 2: inline script left alone
  assert.equal($('script:not([type]):not([src])').length, 1);

  // test 3: relative script resolved
  assert.equal($('script[type="module"][src="/_astro/src/pages/relative.js"]').length, 2); // we have 2 of these!

  // test 4: absolute script left alone
  assert.equal($('script[type="module"][src="/absolute.js"]').length, 1);
});

Resolution.run();

import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { doc } from './test-utils.js';
import { setup } from './helpers.js';

const GlobalBuild = suite('Astro.* built');

setup(GlobalBuild, './fixtures/astro-global', {
  runtimeOptions: {
    mode: 'production',
  },
});

GlobalBuild('Astro.resolve in the build', async (context) => {
  const result = await context.runtime.load('/resolve');
  assert.ok(!result.error, `build error: ${result.error}`);

  const html = result.contents;
  const $ = doc(html);
  assert.equal($('img').attr('src'), '/blog/_astro/src/images/penguin.png');
});

GlobalBuild.run();

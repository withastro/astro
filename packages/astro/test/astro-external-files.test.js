import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { setupBuild } from './helpers.js';

const extRef = suite('Externeal file references');

setupBuild(extRef, './fixtures/astro-external-files');

const snapshot = `<!DOCTYPE html><html><head><script src="/external-file.js" type="module"></script></head><body>
    Check console for message.
  </body></html>`;

extRef('Build with externeal reference', async (context) => {
  await context.build();
  let rss = await context.readFile('/index.html');
  assert.equal(rss, snapshot);
});

extRef.run();

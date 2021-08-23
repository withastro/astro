import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { setupBuild } from './helpers.js';

const extRef = suite('Externeal reference');

setupBuild(extRef, './fixtures/astro-ext-ref');

const snapshot = `<!DOCTYPE html><html><head><script type="module">
      import "./index.js";
    </script></head><body>
    Check console for message.
  </body></html>`;

extRef('Build with externeal reference', async (context) => {
  await context.build();
  let rss = await context.readFile('/index.html');
  assert.match(rss, snapshot);
});

extRef.run();

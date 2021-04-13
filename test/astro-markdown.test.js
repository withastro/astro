import { existsSync, promises as fsPromises } from 'fs';
import { join } from 'path';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { createRuntime } from '../lib/runtime.js';
import { build } from '../lib/build.js';
import { loadConfig } from '../lib/config.js';
import { doc } from './test-utils.js';

const { rmdir, readFile } = fsPromises;

const Markdown = suite('Astro Markdown');

let runtime, setupError, fixturePath, astroConfig;

Markdown.before(async () => {
  fixturePath = new URL('./fixtures/astro-markdown', import.meta.url).pathname;

  astroConfig = await loadConfig(fixturePath);

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

Markdown.after(async () => {
  (await runtime) && runtime.shutdown();
  rmdir(join(fixturePath, '_site'), { recursive: true });
});

Markdown('No errors creating a runtime', () => {
  assert.equal(setupError, undefined);
});

Markdown('Can load markdown pages with hmx', async () => {
  const result = await runtime.load('/post');

  assert.equal(result.statusCode, 200);

  const $ = doc(result.contents);
  assert.ok($('#first').length, 'There is a div added in markdown');
  assert.ok($('#test').length, 'There is a div added via a component from markdown');
});

Markdown('Can load more complex jsxy stuff', async () => {
  const result = await runtime.load('/complex');

  const $ = doc(result.contents);
  const $el = $('#test');
  assert.equal($el.text(), 'Hello world');
});

Markdown('Bundles client-side JS for prod', async () => {
  await build(astroConfig);

  const complexHtml = await readFile(join(fixturePath, './_site/complex/index.html'), 'utf-8');

  assert.match(complexHtml, `import("/_astro/components/Counter.js"`);
  assert.ok(existsSync(join(fixturePath, `./_site/_astro/components/Counter.js`)), 'Counter.jsx is bundled for prod');
});

Markdown.run();

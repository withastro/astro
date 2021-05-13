import { promises as fsPromises } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { createRuntime } from '#astro/runtime';
import { loadConfig } from '#astro/config';
import { doc } from './test-utils.js';

const { rmdir, readFile } = fsPromises;

const Markdown = suite('Plain Markdown');

let runtime, setupError, fixturePath, astroConfig;

Markdown.before(async () => {
  fixturePath = fileURLToPath(new URL('./fixtures/plain-markdown', import.meta.url));

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
  rmdir(join(fixturePath, 'dist'), { recursive: true });
});

Markdown('No errors creating a runtime', () => {
  assert.equal(setupError, undefined);
});

Markdown('Can load markdown pages with Astro', async () => {
  const result = await runtime.load('/post');

  assert.equal(result.statusCode, 200);

  const $ = doc(result.contents);

  assert.equal($('p').first().text(), 'Hello world!');
  assert.equal($('#first').text(), 'Some content');
  assert.equal($('#interesting-topic').text(), 'Interesting Topic');
});

Markdown.run();

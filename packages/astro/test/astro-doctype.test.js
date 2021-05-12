import { fileURLToPath } from 'url';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { loadConfig } from '#astro/config';
import { createRuntime } from '#astro/runtime';

const DType = suite('doctype');

let runtime, setupError;

DType.before(async () => {
  try {
    const astroConfig = await loadConfig(fileURLToPath(new URL('./fixtures/astro-doctype', import.meta.url)));

    const logging = {
      level: 'error',
      dest: process.stderr,
    };

    runtime = await createRuntime(astroConfig, { logging });
  } catch (err) {
    console.error(err);
    setupError = err;
  }
});

DType.after(async () => {
  (await runtime) && runtime.shutdown();
});

DType('No errors creating a runtime', () => {
  assert.equal(setupError, undefined);
});

DType('Automatically prepends the standards mode doctype', async () => {
  const result = await runtime.load('/prepend');
  if (result.error) throw new Error(result.error);

  const html = result.contents.toString('utf-8');
  assert.ok(html.startsWith('<!doctype html>'), 'Doctype always included');
});

DType.skip('Preserves user provided doctype', async () => {
  const result = await runtime.load('/preserve');
  if (result.error) throw new Error(result.error);

  const html = result.contents.toString('utf-8');
  assert.ok(html.startsWith('<!doctype HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">'), 'Doctype included was preserved');
});

DType.run();

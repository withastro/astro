import { fileURLToPath } from 'url';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { createRuntime } from '#astro/runtime';
import { loadConfig } from '#astro/config';
import { doc } from './test-utils.js';

const React = suite('React Components');

let runtime, setupError;

React.before(async () => {
  const astroConfig = await loadConfig(fileURLToPath(new URL('./fixtures/react-component', import.meta.url)));

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

React.after(async () => {
  (await runtime) && runtime.shutdown();
});

React('No error creating the runtime', () => {
  assert.equal(setupError, undefined);
});

React('Can load React', async () => {
  const result = await runtime.load('/');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('#react-h2').text(), 'Hello world!');
  assert.equal($('#react-h2').attr('data-reactroot'), undefined, 'no reactroot');
  assert.equal($('#arrow-fn-component').length, 1, 'Can use function components');
  assert.equal($('#component-spread-props').length, 1, 'Can use spread for components');
  assert.equal($('#component-spread-props').text(), 'Hello world!');
  assert.equal($('.ts-component').length, 1, 'Can use TS components');
});

React('Includes reactroot on hydrating components', async () => {
  const result = await runtime.load('/');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  const div = $('#research');
  assert.equal(div.attr('data-reactroot'), '', 'Has the hydration attr');
  assert.equal(div.html(), 'foo bar <!-- -->1');
});

React('Throws helpful error message on window SSR', async () => {
  const result = await runtime.load('/window');
  assert.match(
    result.error.toString('utf8'),
    `[/window]
    The window object is not available during server-side rendering (SSR).
    Try using \`import.meta.env.SSR\` to write SSR-friendly code.
    https://docs.astro.build/reference/api-reference/#importmeta`
  );
});

React('Can load Vue', async () => {
  const result = await runtime.load('/');
  assert.ok(!result.error, `build error: ${result.error}`);

  const $ = doc(result.contents);
  assert.equal($('#vue-h2').text(), 'Hasta la vista, baby');
});

React('Can use a pragma comment', async () => {
  const result = await runtime.load('/pragma-comment');
  assert.ok(!result.error, `build error: ${result.error}`);
  const $ = doc(result.contents);
  assert.equal($('.pragma-comment').length, 2, 'rendered the PragmaComment component.');
});

React('uses the new JSX transform', async () => {
  const result = await runtime.load('/');
  assert.ok(!result.error, `build error: ${result.error}`);

  // Grab the imports
  const exp = /import\("(.+?)"\)/g;
  let match, componentUrl;
  while ((match = exp.exec(result.contents))) {
    if (match[1].includes('Research.js')) {
      componentUrl = match[1];
      break;
    }
  }
  const component = await runtime.load(componentUrl);
  const jsxRuntime = component.imports.filter((i) => i.specifier.includes('jsx-runtime'));

  assert.ok(jsxRuntime, 'react/jsx-runtime is used for the component');
});

React.run();

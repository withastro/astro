import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { createRuntime } from '../lib/runtime.js';
import { loadConfig } from '../lib/config.js';
import { doc } from './test-utils.js';

const StylesSSR = suite('Styles SSR');

let runtime;

/** Basic CSS minification; removes some flakiness in testing CSS */
function cssMinify(css) {
  return css
    .trim() // remove whitespace
    .replace(/\n\s*/g, '') // collapse lines
    .replace(/\s*\{/g, '{') // collapse selectors
    .replace(/:\s*/g, ':') // collapse attributes
    .replace(/;}/g, '}'); // collapse block
}

StylesSSR.before(async () => {
  const astroConfig = await loadConfig(new URL('./fixtures/astro-styles-ssr', import.meta.url).pathname);

  const logging = {
    level: 'error',
    dest: process.stderr,
  };

  runtime = await createRuntime(astroConfig, { logging });
});

StylesSSR.after(async () => {
  (await runtime) && runtime.shutdown();
});

StylesSSR('Has <link> tags', async () => {
  const MUST_HAVE_LINK_TAGS = [
    '/_astro/components/ReactCSS.css',
    '/_astro/components/SvelteScoped.svelte.css',
    '/_astro/components/VueCSS.vue.css',
    '/_astro/components/VueModules.vue.css',
    '/_astro/components/VueScoped.vue.css',
  ];

  const result = await runtime.load('/');
  const $ = doc(result.contents);

  for (const href of MUST_HAVE_LINK_TAGS) {
    const el = $(`link[href="${href}"]`);
    assert.equal(el.length, 1);
  }
});

StylesSSR('Has correct CSS classes', async () => {
  const result = await runtime.load('/');
  const $ = doc(result.contents);

  const MUST_HAVE_CLASSES = {
    '#react-css': 'react-title',
    '#vue-css': 'vue-title',
    '#vue-css-modules': '_title_1gi0u_2', // ⚠️ may be flaky
    '#vue-scoped': 'vue-title', // also has data-v-* property
    '#svelte-scoped': 'svelte-title', // also has additional class
  };

  for (const [selector, className] of Object.entries(MUST_HAVE_CLASSES)) {
    const el = $(selector);
    assert.ok(el.attr('class').includes(className));

    // add’l test: Vue Scoped styles should have data-v-* attribute
    if (selector === '#vue-scoped') {
      const { attribs } = el.get(0);
      const scopeId = Object.keys(attribs).find((k) => k.startsWith('data-v-'));
      assert.ok(scopeId);
    }

    // add’l test: Svelte should have another class
    if (selector === '#svelte-title') {
      assert.not.equal(el.attr('class'), className);
    }
  }
});

StylesSSR('CSS Module support in .astro', async () => {
  const result = await runtime.load('/');
  const $ = doc(result.contents);

  let scopedClass;

  // test 1: <style> tag in <head> is transformed
  const css = cssMinify(
    $('style')
      .html()
      .replace(/\.astro-[A-Za-z0-9-]+/, (match) => {
        scopedClass = match; // get class hash from result
        return match;
      })
  );

  assert.equal(css, `.wrapper${scopedClass}{margin-left:auto;margin-right:auto;max-width:1200px}`);

  // test 2: element received .astro-XXXXXX class (this selector will succeed if transformed correctly)
  const wrapper = $(`.wrapper${scopedClass}`);
  assert.equal(wrapper.length, 1);
});

StylesSSR.run();

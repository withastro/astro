import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { createRuntime } from '../lib/runtime.js';
import { loadConfig } from '../lib/config.js';
import { doc } from './test-utils.js';

const StylesSSR = suite('Styles SSR');

let runtime;

StylesSSR.before(async () => {
  const astroConfig = await loadConfig(new URL('./fixtures/astro-styles-ssr', import.meta.url).pathname);

  const logging = {
    level: 'error',
    dest: process.stderr,
  };

  runtime = await createRuntime(astroConfig, {logging});
});

StylesSSR.after(async () => {
  (await runtime) && runtime.shutdown();
});

StylesSSR('Has <link> tags', async () => {
  const MUST_HAVE_LINK_TAGS = ['/_astro/components/SvelteScoped.svelte.css', '/_astro/components/VueCSS.vue.css', '/_astro/components/ReactCSS.css'];

  const result = await runtime.load('/');
  const $ = doc(result.contents);

  for (const href of MUST_HAVE_LINK_TAGS) {
    const el = $(`link[href="${href}"]`);
    assert.equal(el.length, 1);
  }
});

StylesSSR('Has correct CSS classes', async () => {
  const MUST_HAVE_CSS_CLASSES = ['react-title', 'vue-title', 'svelte-title'];

  const result = await runtime.load('/');
  const $ = doc(result.contents);

  for (const className of MUST_HAVE_CSS_CLASSES) {
    const el = $(`.${className}`);
    assert.equal(el.length, 1);
  }
});

StylesSSR.run();

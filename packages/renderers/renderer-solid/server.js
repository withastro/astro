import { createComponent } from 'solid-js';
import { renderToStringAsync, ssr } from 'solid-js/web/dist/server.js';

async function check(Component, props, children) {
  if (typeof Component !== 'function') return false;

  const { html } = await renderToStaticMarkup(Component, props, children);
  return typeof html === 'string';
}

async function renderToStaticMarkup(Component, props, children) {
  const html = await renderToStringAsync(() => (
    () => createComponent(Component, {
      ...props,
      // In Solid SSR mode, `ssr` creates the expected structure for `children`.
      // In Solid client mode, `ssr` is just a stub.
      children: ssr([`<astro-fragment>${children}</astro-fragment>`]),
    })
  ));
  return { html };
}

export default {
  check,
  renderToStaticMarkup,
};

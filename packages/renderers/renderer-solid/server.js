import { createComponent } from 'solid-js';
import { renderToStringAsync, generateHydrationScript } from 'solid-js/web/dist/server.js';
import StaticHtml from './static-html.js';

async function check(Component, props, children) {
  if (typeof Component !== 'function') return false;

  const { html } = await renderToStaticMarkup(Component, props, children);
  return typeof html === 'string';
}

async function renderToStaticMarkup(Component, props, innerHTML) {
  const html = await renderToStringAsync(() => createComponent(Component, props));
  return { html };
}

export default {
  check,
  renderToStaticMarkup,
};

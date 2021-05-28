import { createElement as h } from 'react';
import { renderToStaticMarkup as renderToString } from 'react-dom/server.js';
import StaticHtml from './static-html.js';

function check(Component, props, children) {
  try {
    const { html } = renderToStaticMarkup(Component, props, children)
    return Boolean(html)
  } catch (e) {}
  return false;
}

function renderToStaticMarkup(Component, props, children) {
  const html = renderToString(h(Component, { ...props, children: h(StaticHtml, { value: children }), innerHTML: children }));
  return { html };
}

export default {
  check,
  renderToStaticMarkup,
};

import { createElement as h } from 'react';
import { renderToStaticMarkup as renderToString } from 'react-dom/server.js';
import StaticHtml from './static-html.js';

export function check(Component, props) {
  try {
    return Boolean(renderToStaticMarkup(h(Component, props)));
  } catch (e) {}
  return false;
};

export function renderToStaticMarkup(Component, props, children) {
  const html = renderToString(h(Component, props, h(StaticHtml, { value: children })))
  return { html };
}

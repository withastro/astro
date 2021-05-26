import { h } from 'preact';
import { renderToString } from 'preact-render-to-string';
import StaticHtml from './static-html.js';

function check(Component, props) {
  try {
    return Boolean(renderToString(h(Component, props)));
  } catch (e) {}
  return false;
}

function renderToStaticMarkup(Component, props, children) {
  const html = renderToString(h(Component, props, h(StaticHtml, { value: children })));
  return { html };
}

export default {
  check,
  renderToStaticMarkup,
};

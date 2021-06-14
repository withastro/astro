import { h, Component as BaseComponent } from 'preact';
import { renderToString } from 'preact-render-to-string';
import StaticHtml from './static-html.js';

function check(Component, props, children) {
  if (typeof Component !== 'function') return false;

  if (typeof Component.prototype.render === 'function') {
    return BaseComponent.isPrototypeOf(Component);
  }

  const { html } = renderToStaticMarkup(Component, props, children);
  return Boolean(html);
}

function renderToStaticMarkup(Component, props, children) {
  const html = renderToString(h(Component, { ...props, children: h(StaticHtml, { value: children }), innerHTML: children }));
  return { html };
}

export default {
  check,
  renderToStaticMarkup,
};

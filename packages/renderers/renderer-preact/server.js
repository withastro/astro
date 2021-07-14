import { h, Component as BaseComponent } from 'preact';
import { renderToString } from 'preact-render-to-string';
import StaticHtml from './static-html.js';

async function check(Component, props, children) {
  if (typeof Component !== 'function') return false;

  if (Component.prototype != null && typeof Component.prototype.render === 'function') {
    return BaseComponent.isPrototypeOf(Component);
  }

  const { html } = await renderToStaticMarkup(Component, props, children);
  return typeof html === 'string';
}

async function renderToStaticMarkup(Component, props, children) {
  const childrenValue = children || (await props.children);
  const html = renderToString(h(Component, {
    ...props,
    children: h(StaticHtml, {
      value: childrenValue
    }),
    innerHTML: children
  }));
  return { html };
}

export default {
  check,
  renderToStaticMarkup,
};

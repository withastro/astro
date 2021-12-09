import { h, Component as BaseComponent } from 'preact';
import render from 'preact-render-to-string';
import StaticHtml from './static-html.js';

function check(Component, props, children) {
  if (typeof Component !== 'function') return false;

  if (Component.prototype != null && typeof Component.prototype.render === 'function') {
    return BaseComponent.isPrototypeOf(Component);
  }

  try {
    const { html } = renderToStaticMarkup(Component, props, children);
    if (typeof html !== 'string') {
      return false;
    }

    // There are edge cases (SolidJS) where Preact *might* render a string,
    // but components would be <undefined></undefined>

    return !/\<undefined\>/.test(html);
  } catch (err) {
    return false;
  }
}

function renderToStaticMarkup(Component, props, children) {
  const html = render(h(Component, props, children != null ? h(StaticHtml, { value: children }) : children));
  return { html };
}

export default {
  check,
  renderToStaticMarkup,
};

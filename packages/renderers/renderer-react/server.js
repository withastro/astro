import { Component as BaseComponent, createElement as h } from 'react';
import { renderToStaticMarkup as reactRenderToStaticMarkup, renderToString } from 'react-dom/server.js';
import StaticHtml from './static-html.js';

const reactTypeof = Symbol.for('react.element');

function check(Component, props, children) {
  if (typeof Component !== 'function') return false;

  if (Component.prototype != null && typeof Component.prototype.render === 'function') {
    return BaseComponent.isPrototypeOf(Component);
  }

  let error = null;
  let isReactComponent = false;
  function Tester(...args) {
    try {
      const vnode = Component(...args);
      if (vnode && vnode['$$typeof'] === reactTypeof) {
        isReactComponent = true;
      }
    } catch (err) {
      error = err;
    }

    return h('div');
  }

  renderToStaticMarkup(Tester, props, children, {});

  if (error) {
    throw error;
  }
  return isReactComponent;
}

function renderToStaticMarkup(Component, props, children, metadata) {
  const vnode = h(Component, { ...props, children: h(StaticHtml, { value: children }), innerHTML: children });
  let html;
  if (metadata && metadata.hydrate) {
    html = renderToString(vnode);
  } else {
    html = reactRenderToStaticMarkup(vnode);
  }
  return { html };
}

export default {
  check,
  renderToStaticMarkup,
};

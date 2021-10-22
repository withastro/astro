import React from 'react';
import ReactDOM from 'react-dom/server.js';
import StaticHtml from './static-html.js';

const reactTypeof = Symbol.for('react.element');

function errorIsComingFromPreactComponent(err) {
  return err.message && err.message.startsWith("Cannot read property '__H'");
}

function check(Component, props, children) {
  if (typeof Component !== 'function') return false;

  if (Component.prototype != null && typeof Component.prototype.render === 'function') {
    return React.Component.isPrototypeOf(Component) || React.PureComponent.isPrototypeOf(Component);
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
      if(!errorIsComingFromPreactComponent(err)) {
        error = err;
      }
    }

    return React.createElement('div');
  }

  renderToStaticMarkup(Tester, props, children, {});

  if (error) {
    throw error;
  }
  return isReactComponent;
}

function renderToStaticMarkup(Component, props, children, metadata) {
  const vnode = React.createElement(Component, {
    ...props,
    children: React.createElement(StaticHtml, { value: children }),
    innerHTML: children,
  });
  let html;
  if (metadata && metadata.hydrate) {
    html = ReactDOM.renderToString(vnode);
  } else {
    html = ReactDOM.renderToStaticMarkup(vnode);
  }
  return { html };
}

export default {
  check,
  renderToStaticMarkup,
};

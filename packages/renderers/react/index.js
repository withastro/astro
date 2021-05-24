import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaticHtml from './static-html';

export default () => {
  return {
    name: '@astro/renderer-react',
    check: (Component, props) => {
      try {
        return Boolean(renderToStaticMarkup(createElement(Component, props)));
      } catch (e) {}
      return false;
    },
    renderToStaticMarkup: (Component, props, children) => {
      const html = renderToStaticMarkup(createElement(Component, props, createElement(StaticHtml, { value: children })))
      return { html };
    }
  }
};

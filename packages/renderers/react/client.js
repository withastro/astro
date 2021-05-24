import { createElement } from 'react';
import { hydrate } from 'react-dom';
import StaticHtml from './static-html';

export default (element) => (Component, props, children) => hydrate(createElement(Component, props, createElement(StaticHtml, { value: children })), element);

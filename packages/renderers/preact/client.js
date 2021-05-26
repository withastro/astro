import { h, hydrate } from 'preact';
import StaticHtml from './static-html.js';

export default (element) => (Component, props, children) => hydrate(h(Component, props, h(StaticHtml, { value: children })), element);

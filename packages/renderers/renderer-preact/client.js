import { h, render } from 'preact';
import StaticHtml from './static-html.js';

export default (element) => (Component, props, children) => render(h(Component, props, h(StaticHtml, { value: children })), element);

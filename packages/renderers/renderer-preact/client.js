import StaticHtml from './static-html.js';
import { h, render } from 'preact';

export default (element) => (Component, props, children) =>
	render(
		h(Component, props, children != null ? h(StaticHtml, { value: children }) : children),
		element
	);

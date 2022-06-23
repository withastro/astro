import { createElement } from 'react';
import { render, hydrate } from 'react-dom';
import StaticHtml from './static-html.js';

export default (element) =>
	(Component, props, { default: children, ...slotted }, { client }) => {
		for (const [key, value] of Object.entries(slotted)) {
			props[key] = createElement(StaticHtml, { value, name: key });
		}
		const componentEl = createElement(
			Component,
			props,
			children != null ? createElement(StaticHtml, { value: children }) : children
		);
		if (client === 'only') {
			return render(componentEl, element);
		}
		return hydrate(componentEl, element);
	};

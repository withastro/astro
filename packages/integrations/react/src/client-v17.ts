import { createElement } from 'react';
import { hydrate, render, unmountComponentAtNode } from 'react-dom';
import { AppEntrypoint } from 'virtual:astro:react-app';
import StaticHtml from './static-html.js';

export default (element: HTMLElement) =>
	(
		Component: any,
		props: Record<string, any>,
		{ default: children, ...slotted }: Record<string, any>,
		{ client }: Record<string, string>,
	) => {
		for (const [key, value] of Object.entries(slotted)) {
			props[key] = createElement(StaticHtml, { value, name: key });
		}
		const baseComponentEl = createElement(
			Component,
			props,
			children != null ? createElement(StaticHtml, { value: children }) : children,
		);
		const componentEl = AppEntrypoint
			? createElement(AppEntrypoint, null, baseComponentEl)
			: baseComponentEl;

		const isHydrate = client !== 'only';
		const bootstrap = isHydrate ? hydrate : render;
		bootstrap(componentEl, element);
		element.addEventListener('astro:unmount', () => unmountComponentAtNode(element), {
			once: true,
		});
	};

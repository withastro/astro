import { createElement, startTransition } from 'react';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import StaticHtml from './static-html.js';

function isAlreadyHydrated(element: HTMLElement) {
	for (const key in element) {
		if (key.startsWith('__reactContainer')) {
			return key as keyof HTMLElement;
		}
	}
}

function createReactElementFromDOMElement(element: any): any {
	let attrs: Record<string, string> = {};
	for (const attr of element.attributes) {
		attrs[attr.name] = attr.value;
	}
	// If the element has no children, we can create a simple React element
	if (element.firstChild === null) {
		return createElement(element.localName, attrs);
	}

	return createElement(
		element.localName,
		attrs,
		Array.from(element.childNodes)
			.map((c: any) => {
				if (c.nodeType === Node.TEXT_NODE) {
					return c.data;
				} else if (c.nodeType === Node.ELEMENT_NODE) {
					return createReactElementFromDOMElement(c);
				} else {
					return undefined;
				}
			})
			.filter((a) => !!a),
	);
}

function getChildren(childString: string, experimentalReactChildren: boolean) {
	if (experimentalReactChildren && childString) {
		let children = [];
		let template = document.createElement('template');
		template.innerHTML = childString;
		for (let child of template.content.children) {
			children.push(createReactElementFromDOMElement(child));
		}
		return children;
	} else if (childString) {
		return createElement(StaticHtml, { value: childString });
	} else {
		return undefined;
	}
}

// Keep a map of roots so we can reuse them on re-renders
let rootMap = new WeakMap<HTMLElement, Root>();
const getOrCreateRoot = (element: HTMLElement, creator: () => Root) => {
	let root = rootMap.get(element);
	if (!root) {
		root = creator();
		rootMap.set(element, root);
	}
	return root;
};

export default (element: HTMLElement) =>
	(
		Component: any,
		props: Record<string, any>,
		{ default: children, ...slotted }: Record<string, any>,
		{ client }: Record<string, string>,
	) => {
		if (!element.hasAttribute('ssr')) return;

		const actionKey = element.getAttribute('data-action-key');
		const actionName = element.getAttribute('data-action-name');
		const stringifiedActionResult = element.getAttribute('data-action-result');

		const formState =
			actionKey && actionName && stringifiedActionResult
				? [JSON.parse(stringifiedActionResult), actionKey, actionName]
				: undefined;

		const renderOptions = {
			identifierPrefix: element.getAttribute('prefix'),
			formState,
		};
		for (const [key, value] of Object.entries(slotted)) {
			props[key] = createElement(StaticHtml, { value, name: key });
		}

		const componentEl = createElement(
			Component,
			props,
			getChildren(children, element.hasAttribute('data-react-children')),
		);
		const rootKey = isAlreadyHydrated(element);
		// HACK: delete internal react marker for nested components to suppress aggressive warnings
		if (rootKey) {
			delete element[rootKey];
		}
		if (client === 'only') {
			return startTransition(() => {
				const root = getOrCreateRoot(element, () => {
					const r = createRoot(element);
					element.addEventListener('astro:unmount', () => r.unmount(), { once: true });
					return r;
				});
				root.render(componentEl);
			});
		}
		startTransition(() => {
			const root = getOrCreateRoot(element, () => {
				const r = hydrateRoot(element, componentEl, renderOptions as any);
				element.addEventListener('astro:unmount', () => r.unmount(), { once: true });
				return r;
			});
			root.render(componentEl);
		});
	};

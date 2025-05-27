import type { AstroComponentMetadata, NamedSSRLoadedRendererValue } from 'astro';
import React from 'react';
import ReactDOM from 'react-dom/server';
import StaticHtml from './static-html.js';

const slotName = (str: string) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());
const reactTypeof = Symbol.for('react.element');

function check(Component: any, props: Record<string, any>, children: any) {
	// Note: there are packages that do some unholy things to create "components".
	// Checking the $$typeof property catches most of these patterns.
	if (typeof Component === 'object') {
		return Component['$$typeof']?.toString().slice('Symbol('.length).startsWith('react');
	}
	if (typeof Component !== 'function') return false;
	if (Component.name === 'QwikComponent') return false;

	if (Component.prototype != null && typeof Component.prototype.render === 'function') {
		return React.Component.isPrototypeOf(Component) || React.PureComponent.isPrototypeOf(Component);
	}

	let isReactComponent = false;
	function Tester(...args: Array<any>) {
		try {
			const vnode = Component(...args);
			if (vnode && vnode['$$typeof'] === reactTypeof) {
				isReactComponent = true;
			}
		} catch {}

		return React.createElement('div');
	}

	renderToStaticMarkup(Tester, props, children, {} as any);

	return isReactComponent;
}

async function renderToStaticMarkup(
	Component: any,
	props: Record<string, any>,
	{ default: children, ...slotted }: Record<string, any>,
	metadata?: AstroComponentMetadata,
) {
	delete props['class'];
	const slots: Record<string, any> = {};
	for (const [key, value] of Object.entries(slotted)) {
		const name = slotName(key);
		slots[name] = React.createElement(StaticHtml, { value, name });
	}
	// Note: create newProps to avoid mutating `props` before they are serialized
	const newProps = {
		...props,
		...slots,
	};
	const newChildren = children ?? props.children;
	if (newChildren != null) {
		newProps.children = React.createElement(StaticHtml, {
			// Adjust how this is hydrated only when the version of Astro supports `astroStaticSlot`
			hydrate: metadata?.astroStaticSlot ? !!metadata.hydrate : true,
			value: newChildren,
		});
	}
	const vnode = React.createElement(Component, newProps);
	let html: string;
	if (metadata?.hydrate) {
		html = ReactDOM.renderToString(vnode);
	} else {
		html = ReactDOM.renderToStaticMarkup(vnode);
	}
	return { html };
}

const renderer: NamedSSRLoadedRendererValue = {
	name: '@astrojs/react',
	check,
	renderToStaticMarkup,
	supportsAstroStaticSlot: true,
};

export default renderer;

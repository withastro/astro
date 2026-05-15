import React from 'react';
import ReactDOM from 'react-dom/server';
import StaticHtml from './static-html.js';
const slotName = (str) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());
const reactTypeof = /* @__PURE__ */ Symbol.for('react.element');
function check(Component, props, children) {
	if (typeof Component === 'object') {
		return Component['$$typeof']?.toString().slice('Symbol('.length).startsWith('react');
	}
	if (typeof Component !== 'function') return false;
	if (Component.name === 'QwikComponent') return false;
	if (Component.prototype != null && typeof Component.prototype.render === 'function') {
		return React.Component.isPrototypeOf(Component) || React.PureComponent.isPrototypeOf(Component);
	}
	let isReactComponent = false;
	function Tester(...args) {
		try {
			const vnode = Component(...args);
			if (vnode && vnode['$$typeof'] === reactTypeof) {
				isReactComponent = true;
			}
		} catch {}
		return React.createElement('div');
	}
	renderToStaticMarkup(Tester, props, children, {});
	return isReactComponent;
}
async function renderToStaticMarkup(Component, props, { default: children, ...slotted }, metadata) {
	delete props['class'];
	const slots = {};
	for (const [key, value] of Object.entries(slotted)) {
		const name = slotName(key);
		slots[name] = React.createElement(StaticHtml, { value, name });
	}
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
	let html;
	if (metadata?.hydrate) {
		html = ReactDOM.renderToString(vnode);
	} else {
		html = ReactDOM.renderToStaticMarkup(vnode);
	}
	return { html };
}
const renderer = {
	name: '@astrojs/react',
	check,
	renderToStaticMarkup,
	supportsAstroStaticSlot: true,
};
var server_v17_default = renderer;
export { server_v17_default as default };

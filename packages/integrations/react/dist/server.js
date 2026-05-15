import opts from 'astro:react:opts';
import React from 'react';
import ReactDOM from 'react-dom/server';
import { incrementId } from './context.js';
import StaticHtml from './static-html.js';
import { createFilter } from '@astrojs/internal-helpers/create-filter';
const slotName = (str) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());
const reactTypeof = /* @__PURE__ */ Symbol.for('react.element');
const reactTransitionalTypeof = /* @__PURE__ */ Symbol.for('react.transitional.element');
const filter = opts?.include || opts?.exclude ? createFilter(opts.include, opts.exclude) : null;
async function check(Component, props, children, metadata) {
	if (typeof Component === 'object') {
		return Component['$$typeof'].toString().slice('Symbol('.length).startsWith('react');
	}
	if (typeof Component !== 'function') return false;
	if (Component.name === 'QwikComponent') return false;
	if (
		typeof Component === 'function' &&
		Component['$$typeof'] === /* @__PURE__ */ Symbol.for('react.forward_ref')
	)
		return false;
	if (Component.prototype != null && typeof Component.prototype.render === 'function') {
		return React.Component.isPrototypeOf(Component) || React.PureComponent.isPrototypeOf(Component);
	}
	if (filter && metadata?.componentUrl && !filter(metadata.componentUrl)) {
		return false;
	}
	let isReactComponent = false;
	function Tester(...args) {
		try {
			const vnode = Component(...args);
			if (
				vnode &&
				(vnode['$$typeof'] === reactTypeof || vnode['$$typeof'] === reactTransitionalTypeof)
			) {
				isReactComponent = true;
			}
		} catch {}
		return React.createElement('div');
	}
	await renderToStaticMarkup.call(this, Tester, props, children);
	return isReactComponent;
}
async function getNodeWritable() {
	let nodeStreamBuiltinModuleName = 'node:stream';
	let { Writable } = await import(
		/* @vite-ignore */
		nodeStreamBuiltinModuleName
	);
	return Writable;
}
function needsHydration(metadata) {
	return metadata?.astroStaticSlot ? !!metadata.hydrate : true;
}
async function renderToStaticMarkup(Component, props, { default: children, ...slotted }, metadata) {
	let prefix;
	if (this && this.result) {
		prefix = incrementId(this.result);
	}
	const attrs = { prefix };
	delete props['class'];
	const slots = {};
	for (const [key, value] of Object.entries(slotted)) {
		const name = slotName(key);
		slots[name] = React.createElement(StaticHtml, {
			hydrate: needsHydration(metadata),
			value,
			name,
		});
	}
	const newProps = {
		...props,
		...slots,
	};
	const newChildren = children ?? props.children;
	if (children && opts.experimentalReactChildren) {
		attrs['data-react-children'] = true;
		const convert = await import('./vnode-children.js').then((mod) => mod.default);
		newProps.children = convert(children);
	} else if (newChildren != null) {
		newProps.children = React.createElement(StaticHtml, {
			hydrate: needsHydration(metadata),
			value: newChildren,
		});
	}
	const formState = this ? await getFormState(this) : void 0;
	if (formState) {
		attrs['data-action-result'] = JSON.stringify(formState[0]);
		attrs['data-action-key'] = formState[1];
		attrs['data-action-name'] = formState[2];
	}
	const vnode = React.createElement(Component, newProps);
	const renderOptions = {
		identifierPrefix: prefix,
		formState,
	};
	let html;
	if (opts.experimentalDisableStreaming) {
		html = ReactDOM.renderToString(vnode);
	} else if ('renderToReadableStream' in ReactDOM) {
		html = await renderToReadableStreamAsync(vnode, renderOptions);
	} else {
		html = await renderToPipeableStreamAsync(vnode, renderOptions);
	}
	html = html.replace(
		/<link\s[^>]*rel="(?:preload|modulepreload|stylesheet|preconnect|dns-prefetch)"[^>]*>/g,
		'',
	);
	return { html, attrs };
}
async function getFormState({ result }) {
	const { request, actionResult } = result;
	if (!actionResult) return void 0;
	if (!isFormRequest(request.headers.get('content-type'))) return void 0;
	const { searchParams } = new URL(request.url);
	const formData = await request.clone().formData();
	const actionKey = formData.get('$ACTION_KEY')?.toString();
	const actionName = searchParams.get('_action');
	if (!actionKey || !actionName) return void 0;
	return [actionResult, actionKey, actionName];
}
async function renderToPipeableStreamAsync(vnode, options) {
	const Writable = await getNodeWritable();
	let html = '';
	return new Promise((resolve, reject) => {
		let error = void 0;
		let stream = ReactDOM.renderToPipeableStream(vnode, {
			...options,
			onError(err) {
				error = err;
				reject(error);
			},
			onAllReady() {
				stream.pipe(
					new Writable({
						write(chunk, _encoding, callback) {
							html += chunk.toString('utf-8');
							callback();
						},
						destroy() {
							resolve(html);
						},
					}),
				);
			},
		});
	});
}
async function readResult(stream) {
	const reader = stream.getReader();
	let result = '';
	const decoder = new TextDecoder('utf-8');
	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			if (value) {
				result += decoder.decode(value);
			} else {
				decoder.decode(new Uint8Array());
			}
			return result;
		}
		result += decoder.decode(value, { stream: true });
	}
}
async function renderToReadableStreamAsync(vnode, options) {
	return await readResult(await ReactDOM.renderToReadableStream(vnode, options));
}
const formContentTypes = ['application/x-www-form-urlencoded', 'multipart/form-data'];
function isFormRequest(contentType) {
	const type = contentType?.split(';')[0].toLowerCase();
	return formContentTypes.some((t) => type === t);
}
const renderer = {
	name: '@astrojs/react',
	check,
	renderToStaticMarkup,
	supportsAstroStaticSlot: true,
};
var server_default = renderer;
export { server_default as default };

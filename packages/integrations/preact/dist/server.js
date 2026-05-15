import opts from 'astro:preact:opts';
import { Component as BaseComponent, h } from 'preact';
import { renderToStringAsync } from 'preact-render-to-string';
import { getContext, incrementIslandId } from './context.js';
import { restoreSignalsOnProps, serializeSignals } from './signals.js';
import StaticHtml from './static-html.js';
import { createFilter } from '@astrojs/internal-helpers/create-filter';
const slotName = (str) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());
let originalConsoleError;
let consoleFilterRefs = 0;
const filter = opts?.include || opts?.exclude ? createFilter(opts.include, opts.exclude) : null;
function setVNodeMask(vNode, mask) {
	vNode._mask = mask;
	vNode.__m = mask;
}
async function check(Component, props, children, metadata) {
	if (typeof Component !== 'function') return false;
	if (Component.name === 'QwikComponent') return false;
	const componentUrl = metadata?.componentUrl;
	if (filter && componentUrl && !filter(componentUrl)) {
		return false;
	}
	if (Component.prototype != null && typeof Component.prototype.render === 'function') {
		return BaseComponent.isPrototypeOf(Component);
	}
	useConsoleFilter();
	try {
		const { html } = await renderToStaticMarkup.call(this, Component, props, children, void 0);
		if (typeof html !== 'string') {
			return false;
		}
		return html === '' ? false : !html.includes('<undefined>');
	} catch {
		return false;
	} finally {
		finishUsingConsoleFilter();
	}
}
function shouldHydrate(metadata) {
	return metadata?.astroStaticSlot ? !!metadata.hydrate : true;
}
async function renderToStaticMarkup(Component, props, { default: children, ...slotted }, metadata) {
	const ctx = getContext(this.result);
	const slots = {};
	for (const [key, value] of Object.entries(slotted)) {
		const name = slotName(key);
		slots[name] = h(StaticHtml, {
			hydrate: shouldHydrate(metadata),
			value,
			name,
		});
	}
	let propsMap = restoreSignalsOnProps(ctx, props);
	const newProps = { ...props, ...slots };
	const attrs = {};
	serializeSignals(ctx, props, attrs, propsMap);
	const islandId = incrementIslandId(ctx);
	attrs['data-preact-island-id'] = islandId.toString();
	const vNode = h(
		Component,
		newProps,
		children != null
			? h(StaticHtml, {
					hydrate: shouldHydrate(metadata),
					value: children,
				})
			: children,
	);
	setVNodeMask(vNode, [islandId, 0]);
	const html = await renderToStringAsync(vNode);
	return { attrs, html };
}
function useConsoleFilter() {
	consoleFilterRefs++;
	if (!originalConsoleError) {
		originalConsoleError = console.error;
		try {
			console.error = filteredConsoleError;
		} catch {}
	}
}
function finishUsingConsoleFilter() {
	consoleFilterRefs--;
}
function filteredConsoleError(msg, ...rest) {
	if (
		consoleFilterRefs > 0 &&
		!process.env.ASTRO_INTERNAL_TEST_DISABLE_CONSOLE_FILTER &&
		typeof msg === 'string'
	) {
		const isKnownReactHookError =
			msg.includes('Invalid hook call.') && // for React v18 and earlier
			(msg.includes('https://reactjs.org/link/invalid-hook-call') || // for React v19 and later
				msg.includes('https://react.dev/link/invalid-hook-call'));
		if (isKnownReactHookError) return;
	}
	originalConsoleError(msg, ...rest);
}
const renderer = {
	name: '@astrojs/preact',
	check,
	renderToStaticMarkup,
	supportsAstroStaticSlot: true,
};
var server_default = renderer;
export { server_default as default };

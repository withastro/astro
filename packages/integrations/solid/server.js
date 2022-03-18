import { renderToString, ssr, createComponent } from 'solid-js/web';

function check(Component, props, children) {
	if (typeof Component !== 'function') return false;
	try {
		const { html } = renderToStaticMarkup(Component, props, children);
		return typeof html === 'string';
	} catch (err) {
		return false;
	}
}

function renderToStaticMarkup(Component, props, children) {
	const html = renderToString(() =>
		createComponent(Component, {
			...props,
			// In Solid SSR mode, `ssr` creates the expected structure for `children`.
			// In Solid client mode, `ssr` is just a stub.
			children: children != null ? ssr(`<astro-fragment>${children}</astro-fragment>`) : children,
		})
	);
	return { html: html + `<script>window._$HY||(_$HY={events:[],completed:new WeakSet,r:{}})</script>` };
}

export default {
	check,
	renderToStaticMarkup,
};

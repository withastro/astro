import type { RendererContext } from './types';
import { renderToString, ssr, createComponent } from 'solid-js/web';
import { getContext, incrementId } from './context.js';

const slotName = (str: string) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());

function check(this: RendererContext, Component: any, props: Record<string, any>, children: any) {
	if (typeof Component !== 'function') return false;
	const { html } = renderToStaticMarkup.call(this, Component, props, children);
	return typeof html === 'string';
}

function renderToStaticMarkup(this: RendererContext, Component: any, props: Record<string, any>, { default: children, ...slotted }: any, metadata?: undefined | Record<string, any>) {
	const renderId = metadata?.hydrate ? incrementId(getContext(this.result)) : '';

	const html = renderToString(() => {
		const slots: Record<string, any> = {};
		for (const [key, value] of Object.entries(slotted)) {
			const name = slotName(key);
			slots[name] = ssr(`<astro-slot name="${name}">${value}</astro-slot>`);
		}
		// Note: create newProps to avoid mutating `props` before they are serialized
		const newProps = {
			...props,
			...slots,
			// In Solid SSR mode, `ssr` creates the expected structure for `children`.
			children: children != null ? ssr(`<astro-slot>${children}</astro-slot>`) : children,
		};

		return createComponent(Component, newProps);
	}, {
		renderId
	});
	return {
		attrs: {
			'data-solid-render-id': renderId
		},
		html
	};
}

export default {
	check,
	renderToStaticMarkup,
};

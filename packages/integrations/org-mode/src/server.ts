import { AstroJSX, jsx } from 'astro/jsx-runtime';
import { renderJSX } from 'astro/runtime/server/index.js';

const slotName = (str: string) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());

export async function check(
	Component: any,
	props: any,
	{ default: children = null, ...slotted }: Record<string, any> = {},
) {
	if (typeof Component !== 'function') return false;

	const slots: Record<string, any> = {};
	for (const [key, value] of Object.entries(slotted)) {
		slots[slotName(key)] = value;
	}

	const result = await Component({ ...props, ...slots, children });
	return result[AstroJSX];
}

export async function renderToStaticMarkup(
	this: any,
	Component: any,
	props = {},
	{ default: children = null, ...slotted }: Record<string, any> = {},
) {
	const slots: Record<string, any> = {};
	for (const [key, value] of Object.entries(slotted)) {
		slots[slotName(key)] = value;
	}

	const { result } = this;
	const html = await renderJSX(result, jsx(Component, { ...props, ...slots, children }));
	return { html };
}

const renderer = {
	name: 'astro:jsx',
	check,
	renderToStaticMarkup,
};

export default renderer;

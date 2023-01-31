import { AstroJSX, jsx } from '../jsx-runtime/index.js';
import { renderJSX } from '../runtime/server/jsx.js';

const slotName = (str: string) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());

export async function check(
	Component: any,
	props: any,
	{ default: children = null, ...slotted } = {}
) {
	if (typeof Component !== 'function') return false;
	const slots: Record<string, any> = {};
	for (const [key, value] of Object.entries(slotted)) {
		const name = slotName(key);
		slots[name] = value;
	}
	try {
		const result = await Component({ ...props, ...slots, children });
		return result[AstroJSX];
	} catch (e) {}
	return false;
}

export async function renderToStaticMarkup(
	this: any,
	Component: any,
	props = {},
	{ default: children = null, ...slotted } = {}
) {
	const slots: Record<string, any> = {};
	for (const [key, value] of Object.entries(slotted)) {
		const name = slotName(key);
		slots[name] = value;
	}

	const { result } = this;
	const html = await renderJSX(result, jsx(Component, { ...props, ...slots, children }));
	return { html };
}

export default {
	check,
	renderToStaticMarkup,
};

import { renderJSX } from '../runtime/server/jsx.js';
import { AstroJSX, jsx } from '../jsx-runtime/index.js';

export async function check(Component: any, props: any, children: any) {
	if (typeof Component !== 'function') return false;
	try {
		const result = await Component({ ...props, children });
		return result[AstroJSX];
	} catch (e) {};
	return false;
}

export async function renderToStaticMarkup(this: any, Component: any, props = {}, children = null) {
	const { result } = this;
	try {
		const html = await renderJSX(result, jsx(Component, { children, ...props }));
		return { html };
	} catch (e) {}
}

export default {
	check,
	renderToStaticMarkup,
};

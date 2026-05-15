import { AstroError } from 'astro/errors';
import { AstroJSX, jsx } from 'astro/jsx-runtime';
import { renderJSX } from 'astro/runtime/server/index.js';
const slotName = (str) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());
async function check(Component, props, { default: children = null, ...slotted } = {}) {
	if (typeof Component !== 'function') return false;
	const slots = {};
	for (const [key, value] of Object.entries(slotted)) {
		const name = slotName(key);
		slots[name] = value;
	}
	try {
		const result = await Component({ ...props, ...slots, children });
		return result[AstroJSX];
	} catch (e) {
		throwEnhancedErrorIfMdxComponent(e, Component);
	}
	return false;
}
async function renderToStaticMarkup(
	Component,
	props = {},
	{ default: children = null, ...slotted } = {},
) {
	const slots = {};
	for (const [key, value] of Object.entries(slotted)) {
		const name = slotName(key);
		slots[name] = value;
	}
	const { result } = this;
	try {
		const html = await renderJSX(result, jsx(Component, { ...props, ...slots, children }));
		return { html };
	} catch (e) {
		throwEnhancedErrorIfMdxComponent(e, Component);
		throw e;
	}
}
function throwEnhancedErrorIfMdxComponent(error, Component) {
	if (Component[/* @__PURE__ */ Symbol.for('mdx-component')]) {
		if (AstroError.is(error)) return;
		error.title = error.name;
		error.hint = `This issue often occurs when your MDX component encounters runtime errors.`;
		throw error;
	}
}
const renderer = {
	name: 'astro:jsx',
	check,
	renderToStaticMarkup,
};
var server_default = renderer;
export { check, server_default as default, renderToStaticMarkup, slotName };

import type { NamedSSRLoadedRendererValue } from '../@types/astro.js';
import { AstroError, AstroUserError } from '../core/errors/errors.js';
import { AstroJSX, jsx } from '../jsx-runtime/index.js';
import { renderJSX } from '../runtime/server/jsx.js';

const slotName = (str: string) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());

// NOTE: In practice, MDX components are always tagged with `__astro_tag_component__`, so the right renderer
// is used directly, and this check is not often used to return true.
export async function check(
	Component: any,
	props: any,
	{ default: children = null, ...slotted } = {},
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
	} catch (e) {
		throwEnhancedErrorIfMdxComponent(e as Error, Component);
	}
	return false;
}

export async function renderToStaticMarkup(
	this: any,
	Component: any,
	props = {},
	{ default: children = null, ...slotted } = {},
) {
	const slots: Record<string, any> = {};
	for (const [key, value] of Object.entries(slotted)) {
		const name = slotName(key);
		slots[name] = value;
	}

	const { result } = this;
	try {
		const html = await renderJSX(result, jsx(Component, { ...props, ...slots, children }));
		return { html };
	} catch (e) {
		throwEnhancedErrorIfMdxComponent(e as Error, Component);
		throw e;
	}
}

function throwEnhancedErrorIfMdxComponent(error: Error, Component: any) {
	// if the exception is from an mdx component
	// throw an error
	if (Component[Symbol.for('mdx-component')]) {
		// if it's an AstroUserError, we don't need to re-throw, keep the original hint
		if (AstroUserError.is(error)) return;
		throw new AstroError({
			message: error.message,
			title: error.name,
			hint: `This issue often occurs when your MDX component encounters runtime errors.`,
			name: error.name,
			stack: error.stack,
		});
	}
}

const renderer: NamedSSRLoadedRendererValue = {
	name: 'astro:jsx',
	check,
	renderToStaticMarkup,
};

export default renderer;

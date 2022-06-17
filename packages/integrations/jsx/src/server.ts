import { Fragment, renderComponent, spreadAttributes, markHTMLString, escapeHTML, HTMLString, voidElementNames } from 'astro/server';
import { AstroJSX, jsx } from './jsx-runtime';

async function render(result: any, vnode: any): Promise<any> {
	switch (true) {
		case (vnode instanceof HTMLString): return vnode;
		case (typeof vnode === 'string'): return markHTMLString(escapeHTML(vnode));
		case (!vnode && vnode !== 0): return '';
		case (vnode.type === Fragment): return render(result, vnode.props.children);
		case (Array.isArray(vnode)): return markHTMLString((await Promise.all(vnode.map((v: any) => render(result, v)))).join(''));
		// case (typeof vnode === 'object'): return vnode ? markHTMLString(`${vnode}`) : '';
	}
	if (vnode[AstroJSX]) {
		if (!vnode.type && vnode.type !== 0) return '';
		if (typeof vnode.type === 'string') {
			return await renderElement(result, vnode.type, vnode.props ?? {});
		}
		if (typeof vnode.type === 'function') {
			try {
				const output = await vnode.type(vnode.props ?? {});
				return await render(result, output);
			} catch (e) {}

			const { children = null, ...props } = vnode.props ?? {};
			const slots: Record<string, any> = {}
			if (children) {
				slots.default = () => render(result, jsx(Fragment, { children }))
			}
			return markHTMLString(await renderComponent(result, vnode.type.name, vnode.type, props, slots));
		}
	}
	// numbers, plain objects, etc
	return markHTMLString(`${vnode}`);
}

async function renderElement(result: any, tag: string, { children, ...props }: Record<string, any>) {
	return markHTMLString(`<${tag}${spreadAttributes(props)}${markHTMLString(
			(children == null || children == '') && voidElementNames.test(tag)
				? `/>`
				: `>${children == null ? '' : await render(result, children)}${tag === 'head' ? '<!--astro:head-->' : ''}</${tag}>`
		)}`);
}

export async function check(Component, props, children) {
	if (typeof Component !== 'function') return false;
	try {
		const result = await Component({ ...props, children });
		return result[AstroJSX];
	} catch (e) {};
	return false;
}

export async function renderToStaticMarkup(this: any, Component, props = {}, children = null) {
	const { result } = this;
	try {
		const html = await render(result, jsx(Component, { children, ...props }));
		return { html };
	} catch (e) {}
}

export default {
	check,
	renderToStaticMarkup,
};

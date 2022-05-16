import { Fragment, renderComponent, spreadAttributes, markHTMLString, voidElementNames } from 'astro/server';
import { AstroJSX, jsx } from './jsx-runtime';

async function render(result: any, vnode: any): Promise<any> {
	switch (true) {
		case (typeof vnode === 'string'): return markHTMLString(vnode);
		case (vnode.type === Fragment): return render(result, vnode.props.children);
		case (Array.isArray(vnode)): return markHTMLString((await Promise.all(vnode.map((v: any) => render(result, v)))).join(''));
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
		}
	}
	return markHTMLString(await renderComponent(result, vnode.type.name, vnode.type, vnode.props ?? {}));
}

async function renderElement(result: any, tag: string, { children, ...props }: Record<string, any>) {
	return markHTMLString(`<${tag}${spreadAttributes(props)}${markHTMLString(
			(children == null || children == '') && voidElementNames.test(tag)
				? `/>`
				: `>${children == null ? '' : await render(result, children)}</${tag}>`
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
	} catch (e) {
		console.log(e);
	}
}

export default {
	check,
	renderToStaticMarkup,
};

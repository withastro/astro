import { toAstroHtml } from './hast-util-to-astro-html.js';
import { jsToTreeNode } from './utils.js';

export function rehypeAstro() {
	return function (tree: any, vfile: any) {
		const newChildren = [];
		const contentNodes = [];

		// hoist all esm code to top
		for (const child of tree.children) {
			if (child.type === 'mdxjsEsm') {
				newChildren.push(child);
			} else {
				contentNodes.push(child);
			}
		}

		const { renderCode, metadata } = toAstroHtml(contentNodes, {}, tree, vfile.path);

		const js = `
import {
	Fragment,
	render as $$render,
	createComponent as $$createComponent,
	renderComponent as $$renderComponent,
	addAttribute as $$addAttribute,
	spreadAttributes as $$spreadAttributes
} from "astro/server/index.js";

export const Content = $$createComponent(async ($$result, $$props, $$slots) => {
  return $$render\`${renderCode}\`;
});

export default Content;`;

		try {
			newChildren.push(jsToTreeNode(js));
		} catch (e) {
			console.log('failed to parse', js);
			throw e;
		}

		// mutate tree as js entirely
		tree.children = newChildren;

		vfile.data.rehypeAstro = metadata;
	};
}

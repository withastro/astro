import { SKIP, visit as _visit } from 'unist-util-visit';

// This is a workaround.
// It fixes a compatibility issue between different, incompatible ASTs given by plugins to Unist
const visit = _visit as (
	node: any,
	type: string,
	callback?: (node: any, index: number, parent: any) => any
) => any;

// This fixes some confusing bugs coming from somewhere inside of our Markdown pipeline.
// `unist`/`remark`/`rehype` (not sure) often generate malformed HTML inside of <astro-root>
// For hydration to work properly, frameworks need the DOM to be the exact same on server/client.
// This reverts some "helpful corrections" that are applied to our perfectly valid HTML!
export default function rehypeIslands(): any {
	return function (node: any): any {
		return visit(node, 'element', (el) => {
			// Bugs only happen inside of <astro-root> islands
			if (el.tagName == 'astro-root') {
				visit(el, 'text', (child, index, parent) => {
					if (child.type === 'text') {
						// Sometimes comments can be trapped as text, which causes them to be escaped
						// This casts them back to real HTML comments
						if (parent && child.value.indexOf('<!--') > -1 && index != null) {
							parent.children.splice(index, 1, {
								...child,
								type: 'comment',
								value: child.value.replace('<!--', '').replace('-->', '').trim(),
							});
							return [SKIP, index];
						}
						// For some reason `rehype` likes to inject extra linebreaks,
						// but React and Vue throw hydration errors when they see these!
						// This removes any extra linebreaks, which is fine because
						// framework compilers don't preserve them anyway
						child.value = child.value.replace(/\n+/g, '');
						return child;
					}
				});
			}
		});
	};
}

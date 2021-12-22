/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('hast').Properties} Properties
 */

import { toString } from 'mdast-util-to-string';
import { visit } from 'unist-util-visit';
import BananaSlug from 'github-slugger';

const slugs = new BananaSlug();

/**
 * Plugin to add anchors headings using GitHub’s algorithm.
 *
 * @type {import('unified').Plugin<void[], Root>}
 */
export default function remarkSlug() {
	return (tree: any) => {
		slugs.reset();
		visit(tree, (node) => {
			console.log(node);
		});
		visit(tree, 'heading', (node) => {
			const data = node.data || (node.data = {});
			const props = /** @type {Properties} */ data.hProperties || (data.hProperties = {});
			let id = props.id;
			id = id ? slugs.slug(String(id), true) : slugs.slug(toString(node));
			data.id = id;
			props.id = id;
		});
	};
}

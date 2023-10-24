import { parse, DOCUMENT_NODE, ELEMENT_NODE, TEXT_NODE } from 'ultrahtml';
import { createElement, Fragment } from 'react';

let ids = 0;
export default function convert(children) {
	let doc = parse(children.toString().trim());
	let id = ids++;
	let key = 0;

	function createReactElementFromNode(node) {
		const childVnodes = Array.isArray(node.children)
			? node.children
					.map((child) => {
						if (child.type === ELEMENT_NODE) {
							return createReactElementFromNode(child);
						} else if (child.type === TEXT_NODE) {
							// 0-length text gets omitted in JSX
							return child.value.trim() ? child.value : undefined;
						}
					})
					.filter((n) => !!n)
			: undefined;

		if (node.type === DOCUMENT_NODE) {
			return createElement(Fragment, {}, childVnodes);
		} else if (node.type === ELEMENT_NODE) {
			const { class: className, ...props } = node.attributes;
			return createElement(node.name, { ...props, className, key: `${id}-${key++}` }, childVnodes);
		}
	}

	const root = createReactElementFromNode(doc);
	return root.props.children;
}

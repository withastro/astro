import { createElement, Fragment } from 'react';
import { DOCUMENT_NODE, ELEMENT_NODE, parse, TEXT_NODE } from 'ultrahtml';
let ids = 0;
function convert(children) {
	let doc = parse(children.toString().trim());
	let id = ids++;
	let key = 0;
	function createReactElementFromNode(node) {
		const childVnodes =
			Array.isArray(node.children) && node.children.length
				? node.children.map((child) => createReactElementFromNode(child)).filter(Boolean)
				: void 0;
		if (node.type === DOCUMENT_NODE) {
			return createElement(Fragment, {}, childVnodes);
		} else if (node.type === ELEMENT_NODE) {
			const { class: className, ...props } = node.attributes;
			return createElement(node.name, { ...props, className, key: `${id}-${key++}` }, childVnodes);
		} else if (node.type === TEXT_NODE) {
			return node.value.trim() ? node.value : void 0;
		}
	}
	const root = createReactElementFromNode(doc);
	return root.props.children;
}
export { convert as default };

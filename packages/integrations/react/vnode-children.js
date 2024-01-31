import { parse, DOCUMENT_NODE, ELEMENT_NODE, TEXT_NODE } from 'ultrahtml';
import { createElement, Fragment } from 'react';
import styleToObject from 'style-to-object';
import { unescape } from 'html-escaper';

let ids = 0;
export default function convert(children) {
	let doc = parse(children.toString().trim());
	let id = ids++;
	let key = 0;

	function createReactElementFromNode(node) {
		const childVnodes =
			Array.isArray(node.children) && node.children.length
				? node.children.map((child) => createReactElementFromNode(child)).filter(Boolean)
				: undefined;

		if (node.type === DOCUMENT_NODE) {
			return createElement(Fragment, {}, childVnodes);
		} else if (node.type === ELEMENT_NODE) {
			const { class: className, style: styleCss, ...props } = node.attributes;
			const style = styleToObject(styleCss);
			return createElement(node.name, { ...props, className, style, key: `${id}-${key++}` }, childVnodes);
		} else if (node.type === TEXT_NODE) {
			// 0-length text gets omitted in JSX
			return node.value.trim() ? unescape(node.value) : undefined;
		}
	}

	const root = createReactElementFromNode(doc);
	return root.props.children;
}

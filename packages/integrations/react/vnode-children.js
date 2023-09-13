import { parse, walkSync, DOCUMENT_NODE, ELEMENT_NODE, TEXT_NODE } from 'ultrahtml';
import { createElement, Fragment } from 'react';

let ids = 0;
export default function convert(children) {
	const nodeMap = new WeakMap();
	let doc = parse(children.toString().trim());
	let id = ids++;
	let key = 0;
	let root = createElement(Fragment, { children: [] });

	walkSync(doc, (node, parent, index) => {
		let newNode = {};
		if (node.type === DOCUMENT_NODE) {
			nodeMap.set(node, root);
		} else if (node.type === ELEMENT_NODE) {
			const { class: className, ...props } = node.attributes;
			// NOTE: do not manually pass `children`, React handles this internally
			newNode = createElement(node.name, { ...props, className, key: `${id}-${key++}` });
			nodeMap.set(node, newNode);
			if (parent) {
				const newParent = nodeMap.get(parent);
				newParent.props.children[index] = newNode;
			}
		} else if (node.type === TEXT_NODE) {
			newNode = node.value;
			if (newNode.trim() && parent) {
				const newParent = nodeMap.get(parent);
				newParent.props.children[index] = newNode;
			}
		}
	});

	return root.props.children;
}

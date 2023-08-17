import { parse, walkSync, DOCUMENT_NODE, ELEMENT_NODE, TEXT_NODE } from 'ultrahtml';
import { createElement, Fragment } from 'react';

export default function convert(children) {
	const nodeMap = new WeakMap();
	let doc = parse(children.toString().trim());
	let root = createElement(Fragment, { children: [] });

	walkSync(doc, (node, parent, index) => {
		let newNode = {};
		if (node.type === DOCUMENT_NODE) {
			nodeMap.set(node, root);
		} else if (node.type === ELEMENT_NODE) {
			const { class: className, ...props } = node.attributes;
			newNode = createElement(node.name, { ...props, className, children: [] });
			nodeMap.set(node, newNode);
			if (parent) {
				const newParent = nodeMap.get(parent);
				newParent.props.children[index] = newNode;
			}
		} else if (node.type === TEXT_NODE) {
			newNode = node.value.trim();
			if (newNode.trim()) {
				if (parent) {
					const newParent = nodeMap.get(parent);
					if (parent.children.length === 1) {
						newParent.props.children[0] = newNode;
					} else {
						newParent.props.children[index] = newNode;
					}
				}
			}
		}
	});

	return root.props.children;
}

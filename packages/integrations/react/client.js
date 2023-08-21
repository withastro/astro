import { createElement, startTransition } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import StaticHtml from './static-html.js';
import { Portal } from './wrapper.js';
import { Fragment } from 'react';

function isAlreadyHydrated(element) {
	for (const key in element) {
		if (key.startsWith('__reactContainer')) {
			return key;
		}
	}
}

const app = document.createElement('astro-app');
const root = createRoot(app)
const instances = new Map();
const instanceChildren = new Map();
const instanceParents = new Map();

function buildTree() {
	const vnodes = [];
	function addNode(node) {
		const parent = instanceParents.get(node);
		const children = instanceChildren.get(node);
		const self = node({ children: children.map(child => addNode(child) )});
		if (!parent) {
			vnodes.push(self);
		} else {
			return self;
		}
	}
	for (const i of instances.values()) {
		addNode(i);
	}
	return vnodes;
}

export default (element) => (Component, props, { default: children, ...slotted }, meta) => {
		if (!element.hasAttribute('ssr')) return;
		if (element.parentElement.closest('astro-island[ssr]')) return;

		const parentElement = element.parentElement.closest('astro-island');
		let parentInstance = null;
		if (parentElement) parentInstance = instances.get(parentElement);

		const renderOptions = {
			identifierPrefix: element.getAttribute('prefix'),
		};
		for (const [key, value] of Object.entries(slotted)) {
			props[key] = createElement(StaticHtml, { value, name: key });
		}
		const instance = ({ children: _children = [] }) => createElement(Portal, { host: element }, createElement(
			Component,
			props,
			children != null ? createElement(StaticHtml, { value: children }) : children,
			..._children
		));

		instances.set(element, instance);
		instanceChildren.set(instance, [])
		if (parentInstance) {
			instanceChildren.set(parentInstance, [...instanceChildren.get(parentInstance), instance])
			instanceParents.set(instance, parentInstance)
		}
		const tree = buildTree();
		element.replaceChildren();
		root.render(createElement(Fragment, {}, ...tree))
	}

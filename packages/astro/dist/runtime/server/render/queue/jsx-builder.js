import { isVNode } from '../../../../jsx-runtime/index.js';
import { HTMLString, markHTMLString, spreadAttributes, voidElementNames } from '../../index.js';
import { isAstroComponentFactory } from '../astro/factory.js';
import { createAstroComponentInstance } from '../astro/instance.js';
import { renderJSX } from '../../jsx.js';
const ClientOnlyPlaceholder = 'astro-client-only';
let jsxQueueStats = {
	vnodeCount: 0,
	elementCount: 0,
	componentCount: 0,
	hasLogged: false,
};
function getJSXQueueStats() {
	return { ...jsxQueueStats };
}
function resetJSXQueueStats() {
	jsxQueueStats = {
		vnodeCount: 0,
		elementCount: 0,
		componentCount: 0,
		hasLogged: false,
	};
}
function renderJSXToQueue(vnode, result, queue, pool, stack, parent, metadata) {
	jsxQueueStats.vnodeCount = jsxQueueStats.vnodeCount + 1;
	if (vnode instanceof HTMLString) {
		const html = vnode.toString();
		if (html.trim() === '') return;
		const node = pool.acquire('html-string', html);
		node.html = html;
		queue.nodes.push(node);
		return;
	}
	if (typeof vnode === 'string') {
		const node = pool.acquire('text', vnode);
		node.content = vnode;
		queue.nodes.push(node);
		return;
	}
	if (typeof vnode === 'number' || typeof vnode === 'boolean') {
		const str = String(vnode);
		const node = pool.acquire('text', str);
		node.content = str;
		queue.nodes.push(node);
		return;
	}
	if (vnode == null || vnode === false) {
		return;
	}
	if (Array.isArray(vnode)) {
		for (let i = vnode.length - 1; i >= 0; i = i - 1) {
			stack.push({ node: vnode[i], parent, metadata });
		}
		return;
	}
	if (!isVNode(vnode)) {
		const str = String(vnode);
		const node = pool.acquire('text', str);
		node.content = str;
		queue.nodes.push(node);
		return;
	}
	handleVNode(vnode, result, queue, pool, stack, parent, metadata);
}
function handleVNode(vnode, result, queue, pool, stack, parent, metadata) {
	if (!vnode.type) {
		throw new Error(
			`Unable to render ${result.pathname} because it contains an undefined Component!
Did you forget to import the component or is it possible there is a typo?`,
		);
	}
	if (vnode.type === /* @__PURE__ */ Symbol.for('astro:fragment')) {
		stack.push({ node: vnode.props?.children, parent, metadata });
		return;
	}
	if (isAstroComponentFactory(vnode.type)) {
		jsxQueueStats.componentCount = jsxQueueStats.componentCount + 1;
		const factory = vnode.type;
		let props = {};
		let slots = {};
		for (const [key, value] of Object.entries(vnode.props ?? {})) {
			if (key === 'children' || (value && typeof value === 'object' && value['$$slot'])) {
				slots[key === 'children' ? 'default' : key] = () => renderJSX(result, value);
			} else {
				props[key] = value;
			}
		}
		const displayName = metadata?.displayName || factory.name || 'Anonymous';
		const instance = createAstroComponentInstance(result, displayName, factory, props, slots);
		const queueNode = pool.acquire('component');
		queueNode.instance = instance;
		queue.nodes.push(queueNode);
		return;
	}
	if (typeof vnode.type === 'string' && vnode.type !== ClientOnlyPlaceholder) {
		jsxQueueStats.elementCount = jsxQueueStats.elementCount + 1;
		renderHTMLElement(vnode, result, queue, pool, stack, parent, metadata);
		return;
	}
	if (typeof vnode.type === 'function') {
		if (vnode.props?.['server:root']) {
			const output3 = vnode.type(vnode.props ?? {});
			stack.push({ node: output3, parent, metadata });
			return;
		}
		const output2 = vnode.type(vnode.props ?? {});
		stack.push({ node: output2, parent, metadata });
		return;
	}
	const output = renderJSX(result, vnode);
	stack.push({ node: output, parent, metadata });
}
function renderHTMLElement(vnode, _result, queue, pool, stack, parent, metadata) {
	const tag = vnode.type;
	const { children, ...props } = vnode.props ?? {};
	const attrs = spreadAttributes(props);
	const isVoidElement = (children == null || children === '') && voidElementNames.test(tag);
	if (isVoidElement) {
		const html = `<${tag}${attrs}/>`;
		const node = pool.acquire('html-string', html);
		node.html = html;
		queue.nodes.push(node);
		return;
	}
	const openTag = `<${tag}${attrs}>`;
	const openTagHtml = queue.htmlStringCache
		? queue.htmlStringCache.getOrCreate(openTag)
		: markHTMLString(openTag);
	stack.push({ node: openTagHtml, parent, metadata });
	if (children != null && children !== '') {
		const processedChildren = prerenderElementChildren(tag, children, queue.htmlStringCache);
		stack.push({ node: processedChildren, parent, metadata });
	}
	const closeTag = `</${tag}>`;
	const closeTagHtml = queue.htmlStringCache
		? queue.htmlStringCache.getOrCreate(closeTag)
		: markHTMLString(closeTag);
	stack.push({ node: closeTagHtml, parent, metadata });
}
function prerenderElementChildren(tag, children, htmlStringCache) {
	if (typeof children === 'string' && (tag === 'style' || tag === 'script')) {
		return htmlStringCache ? htmlStringCache.getOrCreate(children) : markHTMLString(children);
	}
	return children;
}
export { getJSXQueueStats, renderJSXToQueue, resetJSXQueueStats };

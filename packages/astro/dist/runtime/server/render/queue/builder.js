import { isPromise } from '../../util.js';
import { isHTMLString, markHTMLString } from '../../escape.js';
import { isAstroComponentFactory, isAPropagatingComponent } from '../astro/factory.js';
import { createAstroComponentInstance, isAstroComponentInstance } from '../astro/instance.js';
import { isRenderInstance } from '../common.js';
import { isRenderInstruction } from '../instruction.js';
import { SlotString } from '../slot.js';
import { isRenderTemplateResult } from '../astro/render-template.js';
import { isHeadAndContent } from '../astro/head-and-content.js';
import { isVNode } from '../../../../jsx-runtime/index.js';
import { renderJSXToQueue } from './jsx-builder.js';
async function buildRenderQueue(root, result, pool) {
	const queue = {
		nodes: [],
		result,
		pool,
		htmlStringCache: result._experimentalQueuedRendering?.htmlStringCache,
	};
	const stack = [{ node: root, parent: null }];
	while (stack.length > 0) {
		const item = stack.pop();
		if (!item) {
			continue;
		}
		let { node, parent } = item;
		if (isPromise(node)) {
			try {
				const resolved = await node;
				stack.push({ node: resolved, parent, metadata: item.metadata });
			} catch (error) {
				throw error;
			}
			continue;
		}
		if (node == null || node === false) {
			continue;
		}
		if (typeof node === 'string') {
			const queueNode = pool.acquire('text', node);
			queueNode.content = node;
			queue.nodes.push(queueNode);
			continue;
		}
		if (typeof node === 'number' || typeof node === 'boolean') {
			const str = String(node);
			const queueNode = pool.acquire('text', str);
			queueNode.content = str;
			queue.nodes.push(queueNode);
			continue;
		}
		if (isHTMLString(node)) {
			const html = node.toString();
			const queueNode = pool.acquire('html-string', html);
			queueNode.html = html;
			queue.nodes.push(queueNode);
			continue;
		}
		if (node instanceof SlotString) {
			const html = node.toString();
			const queueNode = pool.acquire('html-string', html);
			queueNode.html = html;
			queue.nodes.push(queueNode);
			continue;
		}
		if (isVNode(node)) {
			renderJSXToQueue(node, result, queue, pool, stack, parent, item.metadata);
			continue;
		}
		if (Array.isArray(node)) {
			for (const n of node) {
				stack.push({ node: n, parent, metadata: item.metadata });
			}
			continue;
		}
		if (isRenderInstruction(node)) {
			const queueNode = pool.acquire('instruction');
			queueNode.instruction = node;
			queue.nodes.push(queueNode);
			continue;
		}
		if (isRenderTemplateResult(node)) {
			const htmlParts = node['htmlParts'];
			const expressions = node['expressions'];
			if (htmlParts[0]) {
				const htmlString = queue.htmlStringCache
					? queue.htmlStringCache.getOrCreate(htmlParts[0])
					: markHTMLString(htmlParts[0]);
				stack.push({
					node: htmlString,
					parent,
					metadata: item.metadata,
				});
			}
			for (let i = 0; i < expressions.length; i = i + 1) {
				stack.push({ node: expressions[i], parent, metadata: item.metadata });
				if (htmlParts[i + 1]) {
					const htmlString = queue.htmlStringCache
						? queue.htmlStringCache.getOrCreate(htmlParts[i + 1])
						: markHTMLString(htmlParts[i + 1]);
					stack.push({
						node: htmlString,
						parent,
						metadata: item.metadata,
					});
				}
			}
			continue;
		}
		if (isAstroComponentInstance(node)) {
			const queueNode = pool.acquire('component');
			queueNode.instance = node;
			queue.nodes.push(queueNode);
			continue;
		}
		if (isAstroComponentFactory(node)) {
			const factory = node;
			const props = item.metadata?.props || {};
			const slots = item.metadata?.slots || {};
			const displayName = item.metadata?.displayName || factory.name || 'Anonymous';
			const instance = createAstroComponentInstance(result, displayName, factory, props, slots);
			const queueNode = pool.acquire('component');
			queueNode.instance = instance;
			if (isAPropagatingComponent(result, factory)) {
				try {
					const returnValue = await instance.init(result);
					if (isHeadAndContent(returnValue) && returnValue.head) {
						result._metadata.extraHead.push(returnValue.head);
					}
				} catch (error) {
					throw error;
				}
			}
			queue.nodes.push(queueNode);
			continue;
		}
		if (isRenderInstance(node)) {
			const queueNode = pool.acquire('component');
			queueNode.instance = node;
			queue.nodes.push(queueNode);
			continue;
		}
		if (typeof node === 'object' && Symbol.iterator in node) {
			const items = Array.from(node);
			for (const iterItem of items) {
				stack.push({ node: iterItem, parent, metadata: item.metadata });
			}
			continue;
		}
		if (typeof node === 'object' && Symbol.asyncIterator in node) {
			try {
				const items = [];
				for await (const asyncItem of node) {
					items.push(asyncItem);
				}
				for (const iterItem of items) {
					stack.push({ node: iterItem, parent, metadata: item.metadata });
				}
			} catch (error) {
				throw error;
			}
			continue;
		}
		if (node instanceof Response) {
			const queueNode = pool.acquire('html-string', '');
			queueNode.html = '';
			queue.nodes.push(queueNode);
			continue;
		}
		if (isHTMLString(node)) {
			const html = String(node);
			const queueNode = pool.acquire('html-string', html);
			queueNode.html = html;
			queue.nodes.push(queueNode);
		} else {
			const str = String(node);
			const queueNode = pool.acquire('text', str);
			queueNode.content = str;
			queue.nodes.push(queueNode);
		}
	}
	queue.nodes.reverse();
	return queue;
}
export { buildRenderQueue };

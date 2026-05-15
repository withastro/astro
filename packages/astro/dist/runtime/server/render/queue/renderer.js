import { markHTMLString, escapeHTML } from '../../escape.js';
import { chunkToString } from '../common.js';
async function renderQueue(queue, destination) {
	const result = queue.result;
	const pool = queue.pool;
	const cache = queue.htmlStringCache;
	let batchBuffer = '';
	let i = 0;
	while (i < queue.nodes.length) {
		const node = queue.nodes[i];
		try {
			if (canBatch(node)) {
				const batchStart = i;
				while (i < queue.nodes.length && canBatch(queue.nodes[i])) {
					batchBuffer += renderNodeToString(queue.nodes[i]);
					i = i + 1;
				}
				if (batchBuffer) {
					const htmlString = cache ? cache.getOrCreate(batchBuffer) : markHTMLString(batchBuffer);
					destination.write(htmlString);
					batchBuffer = '';
				}
				if (pool) {
					for (let j = batchStart; j < i; j++) {
						pool.release(queue.nodes[j]);
					}
				}
			} else {
				await renderNode(node, destination, result);
				if (pool) {
					pool.release(node);
				}
				i = i + 1;
			}
		} catch (error) {
			throw error;
		}
	}
	if (batchBuffer) {
		const htmlString = cache ? cache.getOrCreate(batchBuffer) : markHTMLString(batchBuffer);
		destination.write(htmlString);
	}
}
function canBatch(node) {
	return node.type === 'text' || node.type === 'html-string';
}
function renderNodeToString(node) {
	switch (node.type) {
		case 'text':
			return node.content ? escapeHTML(node.content) : '';
		case 'html-string':
			return node.html || '';
		case 'component':
		case 'instruction': {
			return '';
		}
	}
}
async function renderNode(node, destination, result) {
	const cache = result._experimentalQueuedRendering?.htmlStringCache;
	switch (node.type) {
		case 'text': {
			if (node.content) {
				const escaped = escapeHTML(node.content);
				const htmlString = cache ? cache.getOrCreate(escaped) : markHTMLString(escaped);
				destination.write(htmlString);
			}
			break;
		}
		case 'html-string': {
			if (node.html) {
				const htmlString = cache ? cache.getOrCreate(node.html) : markHTMLString(node.html);
				destination.write(htmlString);
			}
			break;
		}
		case 'instruction': {
			if (node.instruction) {
				destination.write(node.instruction);
			}
			break;
		}
		case 'component': {
			if (node.instance) {
				let componentHtml = '';
				const componentDestination = {
					write(chunk) {
						if (chunk instanceof Response) return;
						componentHtml += chunkToString(result, chunk);
					},
				};
				await node.instance.render(componentDestination);
				if (componentHtml) {
					destination.write(componentHtml);
				}
			}
			break;
		}
	}
}
export { renderQueue };

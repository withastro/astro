/**
 * We take a root as function and we start creating a quue
 */
export function orderRoot(root) {
	const queue = [root];
	let result = [];
	let previousNode;
	// we apply a do/while because we need to process the root first
	do {
		// we pop elements from the back
		let currentNode = queue.pop();
		if (Array.isArray(currentNode.children)) {
			// if we have children, we fill the queue
			queue.push(...currentNode.children);
			const newNode = {};
			if (currentNode.node) {
				newNode.node = currentNode.node;
			}
			// we need to create a new data structure were we need to keep track of the parent of each node
			// the root doesn't have any parent
			if (previousNode) {
				newNode.parent = previousNode.node;
			}
			// track the previous node
			previousNode = currentNode;
			// fill the new node
			result.push(newNode);
		} else {
			// usually here we have leafs and "children" should be just a string
			const newNode = { content: currentNode.children };
			if (currentNode.node) {
				newNode.node = currentNode.node;
			}
			if (previousNode) {
				newNode.parent = previousNode.node;
			}
			result.push(newNode);
		}
	} while (queue.length > 0);

	return result.reverse();
}

export function renderQueue(queue) {
	let html = '';
	let previousParent;
	while (queue.length > 0) {
		let element = queue.shift();
		if (!element.parent) {
			html = `<${element.node}>${html}</${element.node}>`;
			break;
		}
		if (!previousParent) {
			if (element.node) {
				html += renderElement(element.node, element.content);
			} else {
				html += element.content;
			}
			previousParent = element.parent;
			continue;
		}
		if (previousParent === element.node) {
			if (element.content) {
				if (element.node) {
					html += renderElement(element.node, element.content);
				} else {
					html += element.content;
				}
			} else {
				html = `<${element.node}>${html}</${element.node}>`;
			}
		} else {
			let [side, parent] = renderUntilElement(element, queue, element.parent);
			previousParent = parent;
			html += side;
		}

		previousParent = element.parent;
	}
	return html;
}

function renderUntilElement(previousElement, iterator, parent) {
	let html = '';
	let previousParent;
	if (previousElement.content) {
		if (previousElement.node) {
			html += renderElement(previousElement.node, previousElement.content);
		} else {
			html += previousElement.content;
		}
	} else {
		html = renderElement(previousElement.node, html);
	}
	while (iterator.length > 0) {
		let element = iterator.shift();
		if (element.node === parent) {
			html = renderElement(element.node, html);
			previousParent = element.node;
			break;
		} else {
			if (element.content) {
				if (element.node) {
					html += renderElement(element.node, element.content);
				} else {
					html += element.content;
				}
			} else {
				html = renderElement(element.node, html);
			}
		}
	}
	return [html, previousParent];
}

function renderElement(node, content) {
	return `<${node}>${content}</${node}>`;
}

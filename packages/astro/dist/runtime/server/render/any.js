import { escapeHTML, isHTMLString, markHTMLString } from '../escape.js';
import { isPromise } from '../util.js';
import { isAstroComponentInstance, isRenderTemplateResult } from './astro/index.js';
import { isRenderInstance } from './common.js';
import { SlotString } from './slot.js';
import { createBufferedRenderer } from './util.js';
function renderChild(destination, child) {
	if (typeof child === 'string') {
		destination.write(markHTMLString(escapeHTML(child)));
		return;
	}
	if (isPromise(child)) {
		return child.then((x) => renderChild(destination, x));
	}
	if (child instanceof SlotString) {
		destination.write(child);
		return;
	}
	if (isHTMLString(child)) {
		destination.write(child);
		return;
	}
	if (!child && child !== 0) {
		return;
	}
	if (Array.isArray(child)) {
		return renderArray(destination, child);
	}
	if (typeof child === 'function') {
		return renderChild(destination, child());
	}
	if (isRenderInstance(child)) {
		return child.render(destination);
	}
	if (isRenderTemplateResult(child)) {
		return child.render(destination);
	}
	if (isAstroComponentInstance(child)) {
		return child.render(destination);
	}
	if (ArrayBuffer.isView(child)) {
		destination.write(child);
		return;
	}
	if (typeof child === 'object' && (Symbol.asyncIterator in child || Symbol.iterator in child)) {
		if (Symbol.asyncIterator in child) {
			return renderAsyncIterable(destination, child);
		}
		return renderIterable(destination, child);
	}
	destination.write(child);
}
function renderArray(destination, children) {
	for (let i = 0; i < children.length; i++) {
		const result = renderChild(destination, children[i]);
		if (isPromise(result)) {
			if (i + 1 >= children.length) {
				return result;
			}
			const remaining = children.length - i - 1;
			const flushers = new Array(remaining);
			for (let j = 0; j < remaining; j++) {
				flushers[j] = createBufferedRenderer(destination, (bufferDestination) => {
					return renderChild(bufferDestination, children[i + 1 + j]);
				});
			}
			return result.then(() => {
				let k = 0;
				const iterate = () => {
					while (k < flushers.length) {
						const flushResult = flushers[k++].flush();
						if (isPromise(flushResult)) {
							return flushResult.then(iterate);
						}
					}
				};
				return iterate();
			});
		}
	}
}
function renderIterable(destination, children) {
	const iterator = children[Symbol.iterator]();
	const iterate = () => {
		for (;;) {
			const { value, done } = iterator.next();
			if (done) {
				break;
			}
			const result = renderChild(destination, value);
			if (isPromise(result)) {
				return result.then(iterate);
			}
		}
	};
	return iterate();
}
async function renderAsyncIterable(destination, children) {
	for await (const value of children) {
		await renderChild(destination, value);
	}
}
export { renderChild };

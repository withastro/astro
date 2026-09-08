import { escapeHTML, isHTMLString, markHTMLString } from '../escape.js';
import { isPromise } from '../util.js';
import { isAstroComponentInstance, isRenderTemplateResult } from './astro/index.js';
import { isRenderInstance, type RenderDestination } from './common.js';
import { SlotString } from './slot.js';
import { createBufferedRenderer } from './util.js';

export function renderChild(destination: RenderDestination, child: any): void | Promise<void> {
	// Strings are the most common child type (text expressions like {title}, {name})
	// so check them first for the fastest dispatch in the common case.
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
		// do nothing, safe to ignore falsey values.
		return;
	}

	if (Array.isArray(child)) {
		return renderArray(destination, child);
	}

	if (typeof child === 'function') {
		// Special: If a child is a function, call it automatically.
		// This lets you do {() => ...} without the extra boilerplate
		// of wrapping it in a function and calling it.
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

function renderArray(destination: RenderDestination, children: any[]): void | Promise<void> {
	// Fast path: render children one at a time directly to the destination.
	// If all children are sync, no buffering is needed at all.
	// If a child returns a Promise, fall back to buffered rendering for
	// the remaining children to preserve output ordering.
	for (let i = 0; i < children.length; i++) {
		const result = renderChild(destination, children[i]);

		if (isPromise(result)) {
			// This child is async. Buffer remaining children in parallel
			// to preserve ordering, then flush them sequentially.
			if (i + 1 >= children.length) {
				// No remaining children, just wait for this one
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
				const iterate = (): void | Promise<void> => {
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

function renderIterable(
	destination: RenderDestination,
	children: Iterable<any>,
): void | Promise<void> {
	// although arrays and iterables may be similar, an iterable
	// may be unbounded, so rendering all children eagerly may not
	// be possible.
	const iterator = (children[Symbol.iterator] as () => Iterator<any>)();

	const iterate = (): void | Promise<void> => {
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

async function renderAsyncIterable(
	destination: RenderDestination,
	children: AsyncIterable<any>,
): Promise<void> {
	for await (const value of children) {
		await renderChild(destination, value);
	}
}

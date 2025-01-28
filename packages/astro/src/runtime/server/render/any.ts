import { escapeHTML, isHTMLString, markHTMLString } from '../escape.js';
import { isPromise } from '../util.js';
import { isAstroComponentInstance, isRenderTemplateResult } from './astro/index.js';
import { type RenderDestination, isRenderInstance } from './common.js';
import { SlotString } from './slot.js';
import { renderToBufferDestination } from './util.js';

export function renderChild(destination: RenderDestination, child: any): void | Promise<void> {
	return process.env.GO_FAST === "yes"
		? renderChildFast(destination, child)
		: renderChildSlow(destination, child);
}

export async function renderChildSlow(destination: RenderDestination, child: any) {
	if (isPromise(child)) {
		child = await child;
	}
	if (child instanceof SlotString) {
		destination.write(child);
	} else if (isHTMLString(child)) {
		destination.write(child);
	} else if (Array.isArray(child)) {
		// Render all children eagerly and in parallel
		const childRenders = child.map((c) => {
			return renderToBufferDestination((bufferDestination) => {
				return renderChildSlow(bufferDestination, c);
			});
		});
		for (const childRender of childRenders) {
			if (!childRender) continue;
			await childRender.renderToFinalDestination(destination);
		}
	} else if (typeof child === 'function') {
		// Special: If a child is a function, call it automatically.
		// This lets you do {() => ...} without the extra boilerplate
		// of wrapping it in a function and calling it.
		await renderChildSlow(destination, child());
	} else if (typeof child === 'string') {
		destination.write(markHTMLString(escapeHTML(child)));
	} else if (!child && child !== 0) {
		// do nothing, safe to ignore falsey values.
	} else if (isRenderInstance(child)) {
		await child.render(destination);
	} else if (isRenderTemplateResult(child)) {
		await child.render(destination);
	} else if (isAstroComponentInstance(child)) {
		await child.render(destination);
	} else if (ArrayBuffer.isView(child)) {
		destination.write(child);
	} else if (
		typeof child === 'object' &&
		(Symbol.asyncIterator in child || Symbol.iterator in child)
	) {
		for await (const value of child) {
			await renderChildSlow(destination, value);
		}
	} else {
		destination.write(child);
	}
}

export function renderChildFast(destination: RenderDestination, child: any) : void | Promise<void> {
	if (isPromise(child)) {
		return child.then((x) => renderChildFast(destination, x));
	}

	if (child instanceof SlotString) {
		destination.write(child);
		return;
	}
	
	if (isHTMLString(child)) {
		destination.write(child);
		return;
	}
	
	if (Array.isArray(child)) {
		return renderArray(destination, child);
	}

	if (typeof child === 'function') {
		// Special: If a child is a function, call it automatically.
		// This lets you do {() => ...} without the extra boilerplate
		// of wrapping it in a function and calling it.
		return renderChildFast(destination, child());
	}
	
	if (typeof child === 'string') {
		destination.write(markHTMLString(escapeHTML(child)));
		return;
	}
	
	if (!child && child !== 0) {
		// do nothing, safe to ignore falsey values.
		return;
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
			return renderAsyncIterable(destination, child)
		}
		
		const iterator = (child[Symbol.iterator] as () => Iterator<any>)();

		const executor = (): void | Promise<void> => {
			for (;;) {
				const { value, done } = iterator.next();

				if (done) {
					break;
				}

				const result = renderChildFast(destination, value);

				if (isPromise(result)) {
					return result.then(executor);
				}
			}
		};

		return executor();
	}

	destination.write(child);
}

function renderArray(destination: RenderDestination, children: any[]): void | Promise<void> {
	// Render all children eagerly and in parallel
	const childRenders = children.map((c) => {
		return renderToBufferDestination((bufferDestination) => {
			return renderChildFast(bufferDestination, c);
		});
	});

	const iterator = children[Symbol.iterator]();

	const executor = (): void | Promise<void> => {
		for (;;) {
			const { value, done } = iterator.next();

			if (done) {
				break;
			}

			const result = renderChildFast(destination, value);

			if (isPromise(result)) {
				return result.then(executor);
			}
		}
	};

	return executor();
}

async function renderAsyncIterable(destination: RenderDestination, children: AsyncIterable<any>) {
	for await (const value of children) {
		await renderChildFast(destination, value);
	}
}

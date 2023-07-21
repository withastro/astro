import { escapeHTML, isHTMLString, markHTMLString } from '../escape.js';
import { isAstroComponentInstance, isRenderTemplateResult } from './astro/index.js';
import type { RenderDestination, RenderDestinationChunk } from './common.js';
import { SlotString } from './slot.js';

export async function renderChild(destination: RenderDestination, child: any) {
	child = await child;
	if (child instanceof SlotString) {
		if (child.instructions) {
			for (const instruction of child.instructions) {
				destination.write(instruction);
			}
		}
		// TODO: check this
		destination.write(child)
	} else if (isHTMLString(child)) {
		// TODO: revisit this type
		destination.write(child as any);
	} else if (Array.isArray(child)) {
		const promises = renderChildrenInParallelAsync(child);
		for (const promise of promises) {
			const chunks = await promise;
			for (const chunk of chunks) {
				destination.write(markHTMLString(chunk));
			}
		}
	} else if (typeof child === 'function') {
		// Special: If a child is a function, call it automatically.
		// This lets you do {() => ...} without the extra boilerplate
		// of wrapping it in a function and calling it.
		await renderChild(destination, child());
	} else if (typeof child === 'string') {
		destination.write(markHTMLString(escapeHTML(child)));
	} else if (!child && child !== 0) {
		// do nothing, safe to ignore falsey values.
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
			destination.write(value);
		}
	} else {
		destination.write(child);
	}
}

/**
 * Receives an array of child, kicks off each of their rendering in parallel,
 * return an array of rendering promises. Each rendering promise returns the
 * chunks array to be written to the final render destination.
 */
export function renderChildrenInParallelAsync(
	children: any[]
): Promise<RenderDestinationChunk[]>[] {
	const promises: Promise<RenderDestinationChunk[]>[] = [];
	for (const child of children) {
		// Create a rendering promise for each child
		promises.push(
			(async () => {
				// Create a temporary destination that only accumulates the chunks
				const chunks: RenderDestinationChunk[] = [];
				const destination: RenderDestination = {
					write: (chunk) => chunks.push(chunk),
				};
				await renderChild(destination, child);
				return chunks;
			})()
		);
	}
	return promises;
}

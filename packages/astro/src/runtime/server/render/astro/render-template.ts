import type { RenderInstruction } from '../types';

import { HTMLBytes, markHTMLString } from '../../escape.js';
import { isPromise } from '../../util.js';
import { renderChild } from '../any.js';
import { EagerAsyncIterableIterator } from '../util.js';

const renderTemplateResultSym = Symbol.for('astro.renderTemplateResult');

// The return value when rendering a component.
// This is the result of calling render(), should this be named to RenderResult or...?
export class RenderTemplateResult {
	public [renderTemplateResultSym] = true;
	private htmlParts: TemplateStringsArray;
	private expressions: any[];
	private error: Error | undefined;
	constructor(htmlParts: TemplateStringsArray, expressions: unknown[]) {
		this.htmlParts = htmlParts;
		this.error = undefined;
		this.expressions = expressions.map((expression) => {
			// Wrap Promise expressions so we can catch errors
			// There can only be 1 error that we rethrow from an Astro component,
			// so this keeps track of whether or not we have already done so.
			if (isPromise(expression)) {
				return Promise.resolve(expression).catch((err) => {
					if (!this.error) {
						this.error = err;
						throw err;
					}
				});
			}
			return expression;
		});
	}

	async *[Symbol.asyncIterator]() {
		const { htmlParts, expressions } = this;

		let iterables: Array<EagerAsyncIterableIterator> = [];
		// all async iterators start running in non-buffered mode to avoid useless caching
		for (let i = 0; i < htmlParts.length; i++) {
			iterables.push(new EagerAsyncIterableIterator(renderChild(expressions[i])));
		}
		// once the execution of the next for loop is suspended due to an async component,
		// this timeout triggers and we start buffering the other iterators
		setTimeout(() => {
			// buffer all iterators that haven't started yet
			iterables.forEach((it) => !it.isStarted() && it.buffer());
		}, 0);
		for (let i = 0; i < htmlParts.length; i++) {
			const html = htmlParts[i];
			const iterable = iterables[i];

			yield markHTMLString(html);
			yield* iterable;
		}
	}
}

// Determines if a component is an .astro component
export function isRenderTemplateResult(obj: unknown): obj is RenderTemplateResult {
	return typeof obj === 'object' && !!(obj as any)[renderTemplateResultSym];
}

export async function* renderAstroTemplateResult(
	component: RenderTemplateResult
): AsyncIterable<string | HTMLBytes | RenderInstruction> {
	for await (const value of component) {
		if (value || value === 0) {
			for await (const chunk of renderChild(value)) {
				switch (chunk.type) {
					case 'directive': {
						yield chunk;
						break;
					}
					default: {
						yield markHTMLString(chunk);
						break;
					}
				}
			}
		}
	}
}

export function renderTemplate(htmlParts: TemplateStringsArray, ...expressions: any[]) {
	return new RenderTemplateResult(htmlParts, expressions);
}

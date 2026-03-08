import { markHTMLString } from '../../escape.js';
import { isPromise } from '../../util.js';
import { renderChild } from '../any.js';
import type { RenderDestination } from '../common.js';
import { createBufferedRenderer } from '../util.js';

const renderTemplateResultSym = Symbol.for('astro.renderTemplateResult');

// The return value when rendering a component.
// This is the result of calling render(), should this be named to RenderResult or...?
export class RenderTemplateResult {
	public [renderTemplateResultSym] = true;
	private htmlParts: TemplateStringsArray;
	public expressions: any[];
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

	render(destination: RenderDestination): void | Promise<void> {
		// Fast path: render HTML parts and expressions directly to the
		// destination without buffering. If all expressions are sync,
		// this avoids all BufferedRenderer allocations. When an async
		// expression is encountered, fall back to buffered rendering
		// for the remaining expressions to preserve output ordering.
		//
		// Template structure: html[0] exp[0] html[1] exp[1] ... html[N]
		// (htmlParts.length === expressions.length + 1)
		const { htmlParts, expressions } = this;

		for (let i = 0; i < htmlParts.length; i++) {
			const html = htmlParts[i];
			if (html) {
				destination.write(markHTMLString(html));
			}

			// expressions[i] doesn't exist for the last htmlPart
			if (i >= expressions.length) break;

			const exp = expressions[i];
			// Skip render if falsy, except the number 0
			if (!(exp || exp === 0)) continue;

			const result = renderChild(destination, exp);

			if (isPromise(result)) {
				// This expression is async. Buffer remaining expressions
				// in parallel to preserve ordering, then flush sequentially.
				const startIdx = i + 1;
				const remaining = expressions.length - startIdx;
				const flushers = new Array(remaining);
				for (let j = 0; j < remaining; j++) {
					const rExp = expressions[startIdx + j];
					flushers[j] = createBufferedRenderer(destination, (bufferDestination) => {
						if (rExp || rExp === 0) {
							return renderChild(bufferDestination, rExp);
						}
					});
				}

				return result.then(() => {
					let k = 0;
					const iterate = (): void | Promise<void> => {
						while (k < flushers.length) {
							// Write the HTML part that precedes this expression
							const rHtml = htmlParts[startIdx + k];
							if (rHtml) {
								destination.write(markHTMLString(rHtml));
							}

							const flushResult = flushers[k++].flush();
							if (isPromise(flushResult)) {
								return flushResult.then(iterate);
							}
						}
						// Write the final trailing HTML part
						const lastHtml = htmlParts[htmlParts.length - 1];
						if (lastHtml) {
							destination.write(markHTMLString(lastHtml));
						}
					};
					return iterate();
				});
			}
		}
	}
}

// Determines if a component is an .astro component
export function isRenderTemplateResult(obj: unknown): obj is RenderTemplateResult {
	return typeof obj === 'object' && obj !== null && !!(obj as any)[renderTemplateResultSym];
}

export function renderTemplate(htmlParts: TemplateStringsArray, ...expressions: any[]) {
	return new RenderTemplateResult(htmlParts, expressions);
}

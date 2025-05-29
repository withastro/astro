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
		// Render all expressions eagerly and in parallel
		const flushers = this.expressions.map((exp) => {
			return createBufferedRenderer(destination, (bufferDestination) => {
				// Skip render if falsy, except the number 0
				if (exp || exp === 0) {
					return renderChild(bufferDestination, exp);
				}
			});
		});

		let i = 0;

		const iterate = (): void | Promise<void> => {
			while (i < this.htmlParts.length) {
				const html = this.htmlParts[i];
				const flusher = flushers[i];

				// increment here due to potential return in
				// Promise scenario
				i++;

				if (html) {
					// only write non-empty strings

					destination.write(markHTMLString(html));
				}

				if (flusher) {
					const result = flusher.flush();

					if (isPromise(result)) {
						return result.then(iterate);
					}
				}
			}
		};

		return iterate();
	}
}

// Determines if a component is an .astro component
export function isRenderTemplateResult(obj: unknown): obj is RenderTemplateResult {
	return typeof obj === 'object' && obj !== null && !!(obj as any)[renderTemplateResultSym];
}

export function renderTemplate(htmlParts: TemplateStringsArray, ...expressions: any[]) {
	return new RenderTemplateResult(htmlParts, expressions);
}

import { markHTMLString } from '../../escape.js';
import { isPromise } from '../../util.js';
import { renderChildrenInParallelAsync } from '../any.js';
import type { RenderDestination } from '../common.js';

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

	async render(destination: RenderDestination) {
		const expressionPromises = renderChildrenInParallelAsync(this.expressions);

		for (let i = 0; i < this.htmlParts.length; i++) {
			const html = this.htmlParts[i];
			const promise = expressionPromises[i];

			destination.write(markHTMLString(html));
			if (promise) {
				const chunks = await promise;
				for (const chunk of chunks) {
					destination.write(chunk);
				}
			}
		}
	}
}

// Determines if a component is an .astro component
export function isRenderTemplateResult(obj: unknown): obj is RenderTemplateResult {
	return typeof obj === 'object' && !!(obj as any)[renderTemplateResultSym];
}

export function renderTemplate(htmlParts: TemplateStringsArray, ...expressions: any[]) {
	return new RenderTemplateResult(htmlParts, expressions);
}

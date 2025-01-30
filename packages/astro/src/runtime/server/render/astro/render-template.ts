import { markHTMLString } from '../../escape.js';
import { isPromise } from '../../util.js';
import { renderChild } from '../any.js';
import type { RenderDestination, RenderFunction } from '../common.js';
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
		return process.env.GO_FAST === "yes"
			? this.renderFast(destination)
			: this.renderSlow(destination);
	}

	async renderSlow(destination: RenderDestination): Promise<void> {
		// Render all expressions eagerly and in parallel
		const expRenders = this.expressions.map((exp) => {
			return createBufferedRenderer(destination, (bufferDestination) => {
				// Skip render if falsy, except the number 0
				if (exp || exp === 0) {
					return renderChild(bufferDestination, exp);
				}
			});
		});

		for (let i = 0; i < this.htmlParts.length; i++) {
			const html = this.htmlParts[i];
			const expRender = expRenders[i];

			destination.write(markHTMLString(html));
			if (expRender) {
				await expRender.flush();
			}
		}
	}

	renderFast(destination: RenderDestination): void | Promise<void> {
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

		const executor = (): void | Promise<void> => {
			for (; i < this.htmlParts.length; i++) {
				const html = this.htmlParts[i];
				const flusher = flushers[i];
	
				destination.write(markHTMLString(html));
				
				if (flusher) {
					const result = flusher.flush();
	
					if (isPromise(result)) {
						i++; // prevent infinite loop!
						return result.then(executor);
					}
				}
			}
		};

		return executor();
	}
}

// Determines if a component is an .astro component
export function isRenderTemplateResult(obj: unknown): obj is RenderTemplateResult {
	return typeof obj === 'object' && obj !== null && !!(obj as any)[renderTemplateResultSym];
}

export function renderTemplate(htmlParts: TemplateStringsArray, ...expressions: any[]) {
	return new RenderTemplateResult(htmlParts, expressions);
}

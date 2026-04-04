import { markHTMLString } from '../../escape.js';
import { isPromise } from '../../util.js';
import { renderChild } from '../any.js';
import type { RenderDestination } from '../common.js';
import { astroAttrKey, astroSpreadKeys, createBufferedRenderer } from '../util.js';

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

		// Deduplicate attributes that are overridden by a subsequent spread.
		// When an element has both a static/expression attribute and a spread
		// that contains the same key, e.g.:
		//   <svg data-icon={icon} {...restProps}>
		// the compiler generates separate addAttribute + spreadAttributes calls.
		// Both produce HTML attribute strings that get concatenated, resulting in
		// duplicate attributes (browsers use the first occurrence). To fix this,
		// we scan for spreadAttributes results and suppress any preceding
		// addAttribute results whose key appears in the spread.
		this._deduplicateAttributes();
	}

	/**
	 * Scans the expressions array for spreadAttributes results (tagged with
	 * astroSpreadKeys) and suppresses preceding addAttribute results (tagged
	 * with astroAttrKey) that share the same key. This ensures that spread
	 * props correctly override static/expression attributes, matching the
	 * expected JS/JSX object spread semantics.
	 */
	private _deduplicateAttributes(): void {
		const { expressions, htmlParts } = this;
		for (let i = 0; i < expressions.length; i++) {
			const exp = expressions[i];
			// Check if this expression is a spreadAttributes result
			if (exp && typeof exp === 'object' && (exp as any)[astroSpreadKeys]) {
				const spreadKeys: Set<string> = (exp as any)[astroSpreadKeys];
				// Look backwards for preceding addAttribute results that conflict.
				// We stop when we hit a non-attribute expression or an htmlPart
				// that contains '>' (indicating we've left the current tag's attrs).
				for (let j = i - 1; j >= 0; j--) {
					const prevExp = expressions[j];
					if (prevExp && typeof prevExp === 'object' && (prevExp as any)[astroAttrKey]) {
						const prevKey: string = (prevExp as any)[astroAttrKey];
						if (spreadKeys.has(prevKey)) {
							// Suppress this attribute - the spread will provide the value
							expressions[j] = '';
						}
					} else if (prevExp && typeof prevExp === 'object' && (prevExp as any)[astroSpreadKeys]) {
						// Hit another spread - stop looking further back
						break;
					}
					// Check the htmlPart between prevExp and the expression after it.
					// If it contains '>' we've crossed an element boundary.
					const partBetween = htmlParts[j + 1];
					if (partBetween && partBetween.includes('>')) {
						break;
					}
				}
			}
		}
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

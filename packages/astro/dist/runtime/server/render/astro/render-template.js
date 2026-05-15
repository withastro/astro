import { markHTMLString } from '../../escape.js';
import { isPromise } from '../../util.js';
import { renderChild } from '../any.js';
import { createBufferedRenderer } from '../util.js';
const renderTemplateResultSym = /* @__PURE__ */ Symbol.for('astro.renderTemplateResult');
class RenderTemplateResult {
	[renderTemplateResultSym] = true;
	htmlParts;
	expressions;
	error;
	constructor(htmlParts, expressions) {
		this.htmlParts = htmlParts;
		this.error = void 0;
		this.expressions = expressions.map((expression) => {
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
	render(destination) {
		const { htmlParts, expressions } = this;
		for (let i = 0; i < htmlParts.length; i++) {
			const html = htmlParts[i];
			if (html) {
				destination.write(markHTMLString(html));
			}
			if (i >= expressions.length) break;
			const exp = expressions[i];
			if (!(exp || exp === 0)) continue;
			const result = renderChild(destination, exp);
			if (isPromise(result)) {
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
					const iterate = () => {
						while (k < flushers.length) {
							const rHtml = htmlParts[startIdx + k];
							if (rHtml) {
								destination.write(markHTMLString(rHtml));
							}
							const flushResult = flushers[k++].flush();
							if (isPromise(flushResult)) {
								return flushResult.then(iterate);
							}
						}
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
function isRenderTemplateResult(obj) {
	return typeof obj === 'object' && obj !== null && !!obj[renderTemplateResultSym];
}
function renderTemplate(htmlParts, ...expressions) {
	return new RenderTemplateResult(htmlParts, expressions);
}
export { RenderTemplateResult, isRenderTemplateResult, renderTemplate };

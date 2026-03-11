import { markHTMLString } from '../../escape.js';
import { isPromise } from '../../util.js';
import { renderChild } from '../any.js';
import type { RenderDestination } from '../common.js';
import { decoder } from '../common.js';
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
		// Store the raw expressions array — avoid allocating a new array via
		// .map() on every call.  Promise-wrapping is deferred to render().
		this.expressions = expressions as any[];
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

			let exp = expressions[i];
			// Skip render if falsy, except the number 0
			if (!(exp || exp === 0)) continue;

			// Lazily wrap promises for error dedup
			if (isPromise(exp)) {
				exp = Promise.resolve(exp).catch((err) => {
					if (!this.error) {
						this.error = err;
						throw err;
					}
				});
				expressions[i] = exp;
			}

			const result = renderChild(destination, exp);

			if (isPromise(result)) {
				// This expression is async. Buffer remaining expressions
				// in parallel to preserve ordering, then flush sequentially.
				const startIdx = i + 1;
				const remaining = expressions.length - startIdx;
				const flushers = new Array(remaining);
				for (let j = 0; j < remaining; j++) {
					let rExp = expressions[startIdx + j];
					if (isPromise(rExp)) {
						rExp = Promise.resolve(rExp).catch((err) => {
							if (!this.error) {
								this.error = err;
								throw err;
							}
						});
						expressions[startIdx + j] = rExp;
					}
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

// ---------------------------------------------------------------------------
// RenderBytesResult — like RenderTemplateResult but the static parts are
// pre-encoded Uint8Arrays emitted by the compiler at module scope.  This
// avoids per-request TextEncoder.encode() calls and markHTMLString allocations
// for all static HTML content.
// ---------------------------------------------------------------------------

export class RenderBytesResult {
	public [renderTemplateResultSym] = true;
	// Static HTML parts as pre-encoded UTF-8 byte arrays (module-level constants).
	private staticParts: Uint8Array[];
	public expressions: any[];
	private error: Error | undefined;

	constructor(staticParts: Uint8Array[], expressions: unknown[]) {
		this.staticParts = staticParts;
		this.error = undefined;
		// Store the raw expressions array directly — avoid allocating a new array
		// via .map() on every call.  Promise-wrapping (for error de-duplication)
		// is deferred to render() where it only runs if an async expression is
		// actually encountered.  For fully-sync components (the common case) this
		// saves one array allocation + N isPromise checks per renderBytes() call.
		this.expressions = expressions as any[];
	}

	// Lazy-decoded string view used by the queue builder (builder.ts) which
	// accesses node['htmlParts'] directly.  Decoded once and cached.
	private _htmlParts: string[] | undefined;
	get htmlParts(): string[] {
		if (!this._htmlParts) {
			this._htmlParts = this.staticParts.map((b) => (b.length > 0 ? decoder.decode(b) : ''));
		}
		return this._htmlParts;
	}

	render(destination: RenderDestination): void | Promise<void> {
		const { staticParts, expressions } = this;

		for (let i = 0; i < staticParts.length; i++) {
			const bytes = staticParts[i];
			// Write the pre-encoded bytes directly — no encoding, no allocation.
			if (bytes.length > 0) {
				destination.write(bytes);
			}

			if (i >= expressions.length) break;

			let exp = expressions[i];
			if (!(exp || exp === 0)) continue;

			// Lazily wrap promises for error dedup — only when we actually
			// encounter one, avoiding the cost for sync-only renders.
			if (isPromise(exp)) {
				exp = Promise.resolve(exp).catch((err) => {
					if (!this.error) {
						this.error = err;
						throw err;
					}
				});
				expressions[i] = exp;
			}

			const result = renderChild(destination, exp);

			if (isPromise(result)) {
				// Async expression encountered — wrap remaining promises lazily
				// and buffer for ordered flushing.
				const startIdx = i + 1;
				const remaining = expressions.length - startIdx;
				const flushers = new Array(remaining);
				for (let j = 0; j < remaining; j++) {
					let rExp = expressions[startIdx + j];
					if (isPromise(rExp)) {
						rExp = Promise.resolve(rExp).catch((err) => {
							if (!this.error) {
								this.error = err;
								throw err;
							}
						});
						expressions[startIdx + j] = rExp;
					}
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
							const rBytes = staticParts[startIdx + k];
							if (rBytes.length > 0) {
								destination.write(rBytes);
							}
							const flushResult = flushers[k++].flush();
							if (isPromise(flushResult)) {
								return flushResult.then(iterate);
							}
						}
						// Write the final trailing static part.
						const lastBytes = staticParts[staticParts.length - 1];
						if (lastBytes.length > 0) {
							destination.write(lastBytes);
						}
					};
					return iterate();
				});
			}
		}
	}
}

export function renderBytes(staticParts: Uint8Array[], expressions: any[]) {
	return new RenderBytesResult(staticParts, expressions);
}

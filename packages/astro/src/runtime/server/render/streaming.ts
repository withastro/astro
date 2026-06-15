import type { SSRResult } from '../../../types/public/internal.js';
import type { AstroVNode } from '../../../jsx-runtime/index.js';
import { isVNode } from '../../../jsx-runtime/index.js';
import { escapeHTML, HTMLString, isHTMLString, markHTMLString } from '../escape.js';
import { spreadAttributes } from '../index.js';
import { isPromise } from '../util.js';
import { renderJSX } from '../jsx.js';
import { renderChild } from './any.js';
import { Fragment, type RenderDestination } from './common.js';
import { createBufferedRenderer, type RendererFlusher, voidElementNames } from './util.js';
import { isAstroComponentFactory } from './astro/factory.js';
import { createAstroComponentInstance } from './astro/instance.js';
import { isRenderTemplateResult, type RenderTemplateResult } from './astro/render-template.js';
import { containsServerDirective, ServerIslandComponent } from './server-islands.js';

const ClientOnlyPlaceholder = 'astro-client-only';

/**
 * Cursor over a RenderTemplateResult. Lets us interleave static HTML parts and
 * dynamic expressions without pushing each part onto the stack or wrapping it
 * in an HTMLString — static parts are appended straight to the batch buffer.
 */
class TemplateFrame {
	/** The RenderTemplateResult this frame walks. */
	templateResult: RenderTemplateResult;
	/** Resume position: the next `htmlParts`/`expressions` index to process. */
	cursor: number;
	constructor(templateResult: RenderTemplateResult) {
		this.templateResult = templateResult;
		this.cursor = 0;
	}

	storeCursor(index: number) {
		this.cursor = index;
	}
}

/**
 * Streaming render engine.
 *
 * Walks the component tree in a single forward pass (explicit stack), batching
 * consecutive static fragments into one write. The static structure
 * (RenderTemplateResult HTML parts, arrays, primitives) never allocates a node
 * object and never wraps HTML parts in `markHTMLString`, so static-heavy pages
 * render with minimal overhead.
 *
 * Dynamic subtrees (components, render instances, promises, JSX) are rendered
 * via `renderChild`. While their output stays synchronous, the engine streams
 * it straight to `destination`. As soon as a dynamic node renders
 * asynchronously, the engine switches to a buffered tail: every remaining
 * dynamic node is started eagerly (so async work runs in parallel) and the
 * buffers are flushed in order. This mirrors `RenderTemplateResult.render`, so
 * async components render concurrently rather than serially.
 *
 * Head propagation is handled by the caller (`bufferHeadContent`) before this
 * runs.
 */
export async function renderStreaming(
	root: unknown,
	result: SSRResult,
	destination: RenderDestination,
): Promise<void> {
	const stack: unknown[] = [root];

	// Per-render cache of HTML element tags for the MDX/.md (astro:jsx) path,
	// where open/close tags are built one element at a time. A tag string
	// depends only on the tag name (always for close tags; for open tags only
	// when the element has no attributes), so repeated elements (thousands of
	// <p>/<li>/…) can share one cached string instead of rebuilding it each
	// time. The keys are tag names, so the cache stays tiny (~one entry per tag).
	const openTagCache = new Map<string, string>();
	const closeTagCache = new Map<string, HTMLString>();
	const closeTagFor = (type: string): HTMLString => {
		let tag = closeTagCache.get(type);
		if (tag === undefined) {
			tag = new HTMLString(`</${type}>`);
			closeTagCache.set(type, tag);
		}
		return tag;
	};

	// Streaming-mode buffer (written directly to `destination`).
	let batch = '';
	// Buffered-tail mode (entered on the first async dynamic node).
	let buffered = false;
	let firstAsync: Promise<void> | null = null;
	const tail: Array<string | RendererFlusher> = [];
	// Static text collected while in buffered-tail mode.
	let tailStatic = '';

	const emitStatic = (s: string) => {
		if (!s) return;
		if (buffered) tailStatic += s;
		else batch += s;
	};
	const flushTailStatic = () => {
		if (tailStatic) {
			tail.push(tailStatic);
			tailStatic = '';
		}
	};

	// Render function for a dynamic node into a (buffered) destination.
	const renderDynamic =
		(node: unknown) =>
		(d: RenderDestination): void | Promise<void> => {
			if (isVNode(node)) {
				return renderJSX(result, node).then((out) => renderChild(d, out));
			}
			return renderChild(d, node);
		};

	// Handle an astro:jsx VNode (JSX in .astro files and MDX/.md pages). Emits
	// HTML elements as static, pushes children, and routes components through
	// the dynamic path.
	const handleVNode = (vnode: AstroVNode) => {
		const type = vnode.type as unknown;
		if (!type) {
			throw new Error(
				`Unable to render ${result.pathname} because it contains an undefined Component!\nDid you forget to import the component or is it possible there is a typo?`,
			);
		}

		// Fragment: process its children.
		if ((type as any) === Fragment) {
			stack.push(vnode.props?.children);
			return;
		}

		// Astro component factory (including `server:defer` islands).
		if (isAstroComponentFactory(type)) {
			const props: Record<string, unknown> = {};
			const slots: Record<string, number | any> = {};
			for (const [key, value] of Object.entries(vnode.props ?? {})) {
				if (
					key === 'children' ||
					(value && typeof value === 'object' && (value as any)['$$slot'])
				) {
					slots[key === 'children' ? 'default' : key] = () => renderJSX(result, value);
				} else {
					props[key] = value;
				}
			}
			const displayName = (type as any).name || 'Anonymous';
			if (containsServerDirective(props)) {
				const island = new ServerIslandComponent(result, props, slots, displayName);
				result._metadata.propagators.add(island);
				stack.push(island);
				return;
			}
			stack.push(createAstroComponentInstance(result, displayName, type as any, props, slots));
			return;
		}

		// HTML element (e.g. 'div', 'span').
		if (typeof type === 'string' && type !== ClientOnlyPlaceholder) {
			const props = vnode.props;
			// Check for attributes without copying props into a new object.
			// Markdown/MDX is mostly elements with no attributes (<p>, <li>,
			// <strong>…), for which we skip both that copy and `spreadAttributes`.
			let hasAttrs = false;
			if (props) {
				for (const key in props) {
					if (key !== 'children') {
						hasAttrs = true;
						break;
					}
				}
			}
			const children = props?.children;
			const isVoid = (children == null || children === '') && voidElementNames.test(type);

			if (!hasAttrs) {
				// No attributes: skip the props copy and `spreadAttributes` entirely,
				// and reuse the cached (constant) open/close tag strings for this tag.
				const key = isVoid ? `${type}/` : type;
				let openTag = openTagCache.get(key);
				if (openTag === undefined) {
					openTag = isVoid ? `<${type}/>` : `<${type}>`;
					openTagCache.set(key, openTag);
				}
				emitStatic(openTag);
				if (!isVoid) {
					// Push close tag first so it is emitted after the children.
					stack.push(closeTagFor(type));
				}
			} else {
				const { children: _children, ...attrsProps } = props ?? {};
				const attrs = spreadAttributes(attrsProps);
				if (isVoid) {
					emitStatic(`<${type}${attrs}/>`);
					return;
				}
				emitStatic(`<${type}${attrs}>`);
				stack.push(markHTMLString(`</${type}>`));
			}

			if (!isVoid && children != null && children !== '') {
				// `<script>`/`<style>` string content is raw HTML, not escaped.
				if (typeof children === 'string' && (type === 'style' || type === 'script')) {
					stack.push(markHTMLString(children));
				} else {
					stack.push(children);
				}
			}
			return;
		}

		// `server:root` page wrapper: call it and process its output.
		if (typeof type === 'function' && (vnode.props as any)?.['server:root']) {
			stack.push((type as any)(vnode.props ?? {}));
			return;
		}

		// Framework components, client-only placeholders, and astro:jsx function
		// components: hand off to renderJSX, which selects the matching framework
		// renderer (and re-enters itself for astro:jsx components that produce more
		// JSX). The promise is pushed onto the stack so it renders through the
		// dynamic (buffered) path.
		stack.push(renderJSX(result, vnode));
	};

	while (stack.length > 0) {
		const node = stack.pop();

		// Skip null/undefined/false (but not 0 or true: Astro renders `true` as "true").
		if (node == null || node === false) continue;

		// Template cursor: append static parts and simple expressions inline,
		// only pushing to the stack for complex (nested) expressions. That way we
		// push to the stack as often as the content nests, not once per expression.
		if (node instanceof TemplateFrame) {
			const htmlParts = node.templateResult.htmlParts;
			const expressions = node.templateResult.expressions;
			let i = node.cursor;
			while (i < htmlParts.length) {
				if (htmlParts[i]) {
					emitStatic(htmlParts[i]);
				}
				// `htmlParts.length === expressions.length + 1`, so the final HTML
				// part has no expression after it. This break must come *after*
				// emitting `htmlParts[i]` — moving it earlier would drop the
				// trailing static (e.g. the closing `</li>` of `<li>${x}</li>`).
				if (i >= expressions.length) {
					break;
				}
				const expression = expressions[i];
				// Advance past this expression now (before any branch below). If it
				// turns out to be a complex expression we'll suspend the frame via
				// `storeCursor(i)`; the saved cursor must point at the *next* part so
				// resuming doesn't re-emit `htmlParts[i]` or re-process this expression.
				i++;
				if (expression == null || expression === false) continue;
				const expressionType = typeof expression;
				if (expressionType === 'string') {
					emitStatic(escapeHTML(expression as string));
					continue;
				}
				if (
					expressionType === 'number' ||
					expressionType === 'bigint' ||
					expressionType === 'boolean'
				) {
					emitStatic(String(expression));
					continue;
				}
				if (expression instanceof HTMLString || isHTMLString(expression)) {
					emitStatic((expression as HTMLString).toString());
					continue;
				}
				// Complex expression: resume this frame after processing it.
				node.storeCursor(i);
				stack.push(node);
				stack.push(expression);
				break;
			}
			continue;
		}

		const nodeType = typeof node;
		if (nodeType === 'string') {
			emitStatic(escapeHTML(node as string));
			continue;
		}
		if (nodeType === 'number' || nodeType === 'bigint' || nodeType === 'boolean') {
			emitStatic(String(node));
			continue;
		}
		if (node instanceof HTMLString || isHTMLString(node)) {
			emitStatic((node as HTMLString).toString());
			continue;
		}
		if (Array.isArray(node)) {
			for (let i = node.length - 1; i >= 0; i--) stack.push(node[i]);
			continue;
		}
		if (isRenderTemplateResult(node)) {
			stack.push(new TemplateFrame(node));
			continue;
		}
		if (isVNode(node)) {
			handleVNode(node as AstroVNode);
			continue;
		}
		// Dynamic node: component instance, render instance, promise, JSX vnode,
		// render instruction, iterable, etc. Rendered via renderChild — streamed
		// directly while synchronous, buffered once a node renders asynchronously.
		if (!buffered) {
			if (batch) {
				destination.write(markHTMLString(batch));
				batch = '';
			}
			// Write the node's output straight to `destination`. It renders
			// synchronously and in order, so putting it in a temporary buffer
			// first and flushing right after would add work without changing the
			// result. Mirrors `renderArray`.
			const rendered = renderDynamic(node)(destination);
			if (isPromise(rendered)) {
				// First async node: stream stops here. Buffer the remaining tail.
				buffered = true;
				firstAsync = rendered;
			}
		} else {
			flushTailStatic();
			// createBufferedRenderer starts the work right away, so async nodes run in parallel.
			tail.push(createBufferedRenderer(destination, renderDynamic(node)));
		}
	}

	if (!buffered) {
		if (batch) {
			destination.write(markHTMLString(batch));
		}
		return;
	}

	// Wait for the first async node to finish writing to `destination`, then
	// flush the buffered tail in order.
	await firstAsync;
	flushTailStatic();
	for (const seg of tail) {
		if (typeof seg === 'string') {
			destination.write(markHTMLString(seg));
		} else {
			const r = seg.flush();
			if (isPromise(r)) await r;
		}
	}
}

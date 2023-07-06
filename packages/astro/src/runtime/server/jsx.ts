/* eslint-disable no-console */
import type { SSRResult } from '../../@types/astro.js';
import { AstroJSX, isVNode, type AstroVNode } from '../../jsx-runtime/index.js';
import {
	escapeHTML,
	HTMLString,
	markHTMLString,
	renderComponentToIterable,
	renderToString,
	spreadAttributes,
	voidElementNames,
} from './index.js';
import { HTMLParts } from './render/common.js';
import type { ComponentIterable } from './render/component';

const ClientOnlyPlaceholder = 'astro-client-only';

class Skip {
	count: number;
	constructor(public vnode: AstroVNode) {
		this.count = 0;
	}

	increment() {
		this.count++;
	}

	haveNoTried() {
		return this.count === 0;
	}

	isCompleted() {
		return this.count > 2;
	}
	static symbol = Symbol('astro:jsx:skip');
}

let originalConsoleError: any;
let consoleFilterRefs = 0;

export async function renderJSX(result: SSRResult, vnode: any): Promise<any> {
	switch (true) {
		case vnode instanceof HTMLString:
			if (vnode.toString().trim() === '') {
				return '';
			}
			return vnode;
		case typeof vnode === 'string':
			return markHTMLString(escapeHTML(vnode));
		case typeof vnode === 'function':
			return vnode;
		case !vnode && vnode !== 0:
			return '';
		case Array.isArray(vnode):
			return markHTMLString(
				(await Promise.all(vnode.map((v: any) => renderJSX(result, v)))).join('')
			);
	}

	// Extract the skip from the props, if we've already attempted a previous render
	let skip: Skip;
	if (vnode.props) {
		if (vnode.props[Skip.symbol]) {
			skip = vnode.props[Skip.symbol];
		} else {
			skip = new Skip(vnode);
		}
	} else {
		skip = new Skip(vnode);
	}

	return renderJSXVNode(result, vnode, skip);
}

async function renderJSXVNode(result: SSRResult, vnode: AstroVNode, skip: Skip): Promise<any> {
	if (isVNode(vnode)) {
		switch (true) {
			case !vnode.type: {
				throw new Error(`Unable to render ${result.pathname} because it contains an undefined Component!
Did you forget to import the component or is it possible there is a typo?`);
			}
			case (vnode.type as any) === Symbol.for('astro:fragment'):
				return renderJSX(result, vnode.props.children);
			case (vnode.type as any).isAstroComponentFactory: {
				let props: Record<string, any> = {};
				let slots: Record<string, any> = {};
				for (const [key, value] of Object.entries(vnode.props ?? {})) {
					if (key === 'children' || (value && typeof value === 'object' && value['$$slot'])) {
						slots[key === 'children' ? 'default' : key] = () => renderJSX(result, value);
					} else {
						props[key] = value;
					}
				}
				const html = markHTMLString(await renderToString(result, vnode.type as any, props, slots));
				return html;
			}
			case !vnode.type && (vnode.type as any) !== 0:
				return '';
			case typeof vnode.type === 'string' && vnode.type !== ClientOnlyPlaceholder:
				return markHTMLString(await renderElement(result, vnode.type as string, vnode.props ?? {}));
		}

		if (vnode.type) {
			if (typeof vnode.type === 'function' && (vnode.type as any)['astro:renderer']) {
				skip.increment();
			}
			if (typeof vnode.type === 'function' && vnode.props['server:root']) {
				const output = await vnode.type(vnode.props ?? {});
				return await renderJSX(result, output);
			}
			if (typeof vnode.type === 'function') {
				if (skip.haveNoTried() || skip.isCompleted()) {
					useConsoleFilter();
					try {
						const output = await vnode.type(vnode.props ?? {});
						let renderResult: any;
						if (output?.[AstroJSX]) {
							renderResult = await renderJSXVNode(result, output, skip);
							return renderResult;
						} else if (!output) {
							renderResult = await renderJSXVNode(result, output, skip);
							return renderResult;
						}
					} catch (e: unknown) {
						if (skip.isCompleted()) {
							throw e;
						}
						skip.increment();
					} finally {
						finishUsingConsoleFilter();
					}
				} else {
					skip.increment();
				}
			}

			const { children = null, ...props } = vnode.props ?? {};
			const _slots: Record<string, any> = {
				default: [],
			};
			function extractSlots(child: any): any {
				if (Array.isArray(child)) {
					return child.map((c) => extractSlots(c));
				}
				if (!isVNode(child)) {
					_slots.default.push(child);
					return;
				}
				if ('slot' in child.props) {
					_slots[child.props.slot] = [...(_slots[child.props.slot] ?? []), child];
					delete child.props.slot;
					return;
				}
				_slots.default.push(child);
			}
			extractSlots(children);
			for (const [key, value] of Object.entries(props)) {
				if (value['$$slot']) {
					_slots[key] = value;
					delete props[key];
				}
			}
			const slotPromises = [];
			const slots: Record<string, any> = {};
			for (const [key, value] of Object.entries(_slots)) {
				slotPromises.push(
					renderJSX(result, value).then((output) => {
						if (output.toString().trim().length === 0) return;
						slots[key] = () => output;
					})
				);
			}
			await Promise.all(slotPromises);

			props[Skip.symbol] = skip;
			let output: ComponentIterable;
			if (vnode.type === ClientOnlyPlaceholder && vnode.props['client:only']) {
				output = await renderComponentToIterable(
					result,
					vnode.props['client:display-name'] ?? '',
					null,
					props,
					slots
				);
			} else {
				output = await renderComponentToIterable(
					result,
					typeof vnode.type === 'function' ? vnode.type.name : vnode.type,
					vnode.type,
					props,
					slots
				);
			}
			if (typeof output !== 'string' && Symbol.asyncIterator in output) {
				let parts = new HTMLParts();
				for await (const chunk of output) {
					parts.append(chunk, result);
				}
				return markHTMLString(parts.toString());
			} else {
				return markHTMLString(output);
			}
		}
	}
	// numbers, plain objects, etc
	return markHTMLString(`${vnode}`);
}

async function renderElement(
	result: any,
	tag: string,
	{ children, ...props }: Record<string, any>
) {
	return markHTMLString(
		`<${tag}${spreadAttributes(props)}${markHTMLString(
			(children == null || children == '') && voidElementNames.test(tag)
				? `/>`
				: `>${
						children == null ? '' : await renderJSX(result, prerenderElementChildren(tag, children))
				  }</${tag}>`
		)}`
	);
}

/**
 * Pre-render the children with the given `tag` information
 */
function prerenderElementChildren(tag: string, children: any) {
	// For content within <style> and <script> tags that are plain strings, e.g. injected
	// by remark/rehype plugins, or if a user explicitly does `<script>{'...'}</script>`,
	// we mark it as an HTML string to prevent the content from being HTML-escaped.
	if (typeof children === 'string' && (tag === 'style' || tag === 'script')) {
		return markHTMLString(children);
	} else {
		return children;
	}
}

/**
 * Reduces console noise by filtering known non-problematic errors.
 *
 * Performs reference counting to allow parallel usage from async code.
 *
 * To stop filtering, please ensure that there always is a matching call
 * to `finishUsingConsoleFilter` afterwards.
 */
function useConsoleFilter() {
	consoleFilterRefs++;

	if (!originalConsoleError) {
		originalConsoleError = console.error;

		try {
			console.error = filteredConsoleError;
		} catch (error) {
			// If we're unable to hook `console.error`, just accept it
		}
	}
}

/**
 * Indicates that the filter installed by `useConsoleFilter`
 * is no longer needed by the calling code.
 */
function finishUsingConsoleFilter() {
	consoleFilterRefs--;

	// Note: Instead of reverting `console.error` back to the original
	// when the reference counter reaches 0, we leave our hook installed
	// to prevent potential race conditions once `check` is made async
}

/**
 * Hook/wrapper function for the global `console.error` function.
 *
 * Ignores known non-problematic errors while any code is using the console filter.
 * Otherwise, simply forwards all arguments to the original function.
 */
function filteredConsoleError(msg: any, ...rest: any[]) {
	if (consoleFilterRefs > 0 && typeof msg === 'string') {
		// In `check`, we attempt to render JSX components through Preact.
		// When attempting this on a React component, React may output
		// the following error, which we can safely filter out:
		const isKnownReactHookError =
			msg.includes('Warning: Invalid hook call.') &&
			msg.includes('https://reactjs.org/link/invalid-hook-call');
		if (isKnownReactHookError) return;
	}
	originalConsoleError(msg, ...rest);
}

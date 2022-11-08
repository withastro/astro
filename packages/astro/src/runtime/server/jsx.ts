/* eslint-disable no-console */
import { SSRResult } from '../../@types/astro.js';
import { AstroJSX, AstroVNode, isVNode } from '../../jsx-runtime/index.js';
import {
	escapeHTML,
	HTMLString,
	markHTMLString,
	renderComponent,
	renderToString,
	spreadAttributes,
	voidElementNames,
} from './index.js';
import { HTMLParts } from './render/common.js';
import type { ComponentIterable } from './render/component';

const ClientOnlyPlaceholder = 'astro-client-only';

const skipAstroJSXCheck = new WeakMap<() => any, number>();
function addSkip(vnode: AstroVNode) {
	if(typeof vnode.type === 'function') {
		skipAstroJSXCheck.set(vnode.type, skipCount(vnode) + 1);
	}
}
function skipCount(vnode: AstroVNode): number {
	if(typeof vnode.type === 'function') {
		return  skipAstroJSXCheck.get(vnode.type) || 0;
	}
	return NaN;
}
function deleteSkips(vnode: AstroVNode) {
	if(typeof vnode.type === 'function') {
		skipAstroJSXCheck.delete(vnode.type);
	}
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
	if (isVNode(vnode)) {
		switch (true) {
			case !vnode.type: {
				throw new Error(`Unable to render ${result._metadata.pathname} because it contains an undefined Component!
Did you forget to import the component or is it possible there is a typo?`);
			}
			case (vnode.type as any) === Symbol.for('astro:fragment'):
				return renderJSX(result, vnode.props.children);
			case (vnode.type as any).isAstroComponentFactory: {
				let props: Record<string, any> = {};
				let slots: Record<string, any> = {};
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
				return markHTMLString(await renderToString(result, vnode.type as any, props, slots));
			}
			case !vnode.type && (vnode.type as any) !== 0:
				return '';
			case typeof vnode.type === 'string' && vnode.type !== ClientOnlyPlaceholder:
				return markHTMLString(await renderElement(result, vnode.type as string, vnode.props ?? {}));
		}

		if (vnode.type) {
			if (typeof vnode.type === 'function' && (vnode.type as any)['astro:renderer']) {
				addSkip(vnode);
			}
			if (typeof vnode.type === 'function' && vnode.props['server:root']) {
				const output = await vnode.type(vnode.props ?? {});
				return await renderJSX(result, output);
			}
			if (typeof vnode.type === 'function') {
				if(skipCount(vnode) === 0 || skipCount(vnode) > 2) {
					useConsoleFilter();
					try {
						const output = await vnode.type(vnode.props ?? {});
						let renderResult: any;
						if (output && output[AstroJSX]) {
							renderResult = await renderJSX(result, output);
							deleteSkips(vnode);
							return renderResult;
						} else if (!output) {
							renderResult = await renderJSX(result, output);
							deleteSkips(vnode);
							return renderResult;
						}
						
					} catch (e: unknown) {
						if(skipCount(vnode) > 2) {
							throw e;
						}
						addSkip(vnode);
					} finally {
						finishUsingConsoleFilter();
					}
				} else {
					addSkip(vnode);
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

			let output: ComponentIterable;
			if (vnode.type === ClientOnlyPlaceholder && vnode.props['client:only']) {
				output = await renderComponent(
					result,
					vnode.props['client:display-name'] ?? '',
					null,
					props,
					slots
				);
			} else {
				output = await renderComponent(
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
				deleteSkips(vnode);
				return markHTMLString(parts.toString());
			} else {
				deleteSkips(vnode);
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
				: `>${children == null ? '' : await renderJSX(result, children)}</${tag}>`
		)}`
	);
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
		// eslint-disable-next-line no-console
		originalConsoleError = console.error;

		try {
			// eslint-disable-next-line no-console
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

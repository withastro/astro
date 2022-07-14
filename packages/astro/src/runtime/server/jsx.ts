/* eslint-disable no-console */
import { SSRResult } from '../../@types/astro.js';
import { AstroJSX, isVNode } from '../../jsx-runtime/index.js';
import {
	escapeHTML,
	Fragment,
	HTMLString,
	markHTMLString,
	renderComponent,
	renderToString,
	spreadAttributes,
	voidElementNames,
} from './index.js';

const skipAstroJSXCheck = new WeakSet();
let originalConsoleError: any;
let consoleFilterRefs = 0;

export async function renderJSX(result: SSRResult, vnode: any): Promise<any> {
	switch (true) {
		case vnode instanceof HTMLString:
			return vnode;
		case typeof vnode === 'string':
			return markHTMLString(escapeHTML(vnode));
		case !vnode && vnode !== 0:
			return '';
		case vnode.type === Fragment:
			return renderJSX(result, vnode.props.children);
		case Array.isArray(vnode):
			return markHTMLString(
				(await Promise.all(vnode.map((v: any) => renderJSX(result, v)))).join('')
			);
		case vnode.type.isAstroComponentFactory: {
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
			return await renderToString(result, vnode.type, props, slots);
		}
	}
	if (vnode[AstroJSX]) {
		if (!vnode.type && vnode.type !== 0) return '';
		if (typeof vnode.type === 'string') {
			return await renderElement(result, vnode.type, vnode.props ?? {});
		}
		if (!!vnode.type) {
			if (!skipAstroJSXCheck.has(vnode.type)) {
				useConsoleFilter();
				try {
					const output = await vnode.type(vnode.props ?? {});
					return await renderJSX(result, output);
				} catch (e) {
					skipAstroJSXCheck.add(vnode.type);
				} finally {
					finishUsingConsoleFilter();
				}
			}

			const { children = null, ...props } = vnode.props ?? {};
			const slots: Record<string, any> = {
				default: [],
			};
			function extractSlots(child: any): any {
				if (Array.isArray(child)) {
					return child.map((c) => extractSlots(c));
				}
				if (!isVNode(child)) {
					return slots.default.push(child);
				}
				if ('slot' in child.props) {
					slots[child.props.slot] = [...(slots[child.props.slot] ?? []), child];
					delete child.props.slot;
					return;
				}
				slots.default.push(child);
			}
			extractSlots(children);
			for (const [key, value] of Object.entries(slots)) {
				slots[key] = () => renderJSX(result, value);
			}

			const renderers = result._metadata.renderers;
			result._metadata.renderers = renderers.filter(r => r.name != 'astro:jsx')
			const output = await renderComponent(result, vnode.type.name, vnode.type, props, slots);
			result._metadata.renderers = renderers
			return markHTMLString(output);
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
}

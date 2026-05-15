import { AstroJSX, isVNode } from '../../jsx-runtime/index.js';
import {
	escapeHTML,
	HTMLString,
	markHTMLString,
	spreadAttributes,
	voidElementNames,
} from './index.js';
import { isAstroComponentFactory } from './render/astro/factory.js';
import { renderComponentToString } from './render/component.js';
import { mergeSlotInstructions, SlotString } from './render/slot.js';
const ClientOnlyPlaceholder = 'astro-client-only';
const hasTriedRenderComponentSymbol = /* @__PURE__ */ Symbol('hasTriedRenderComponent');
async function renderJSX(result, vnode) {
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
		case Array.isArray(vnode): {
			const renderedItems = await Promise.all(vnode.map((v) => renderJSX(result, v)));
			let instructions = null;
			let content = '';
			for (const item of renderedItems) {
				if (item instanceof SlotString) {
					content += item;
					instructions = mergeSlotInstructions(instructions, item);
				} else {
					content += item;
				}
			}
			if (instructions) {
				return markHTMLString(new SlotString(content, instructions));
			}
			return markHTMLString(content);
		}
	}
	return renderJSXVNode(result, vnode);
}
async function renderJSXVNode(result, vnode) {
	if (isVNode(vnode)) {
		switch (true) {
			case !vnode.type: {
				throw new Error(`Unable to render ${result.pathname} because it contains an undefined Component!
Did you forget to import the component or is it possible there is a typo?`);
			}
			case vnode.type === /* @__PURE__ */ Symbol.for('astro:fragment'):
				return renderJSX(result, vnode.props.children);
			case isAstroComponentFactory(vnode.type): {
				let props = {};
				let slots = {};
				for (const [key, value] of Object.entries(vnode.props ?? {})) {
					if (key === 'children' || (value && typeof value === 'object' && value['$$slot'])) {
						slots[key === 'children' ? 'default' : key] = () => renderJSX(result, value);
					} else {
						props[key] = value;
					}
				}
				const str = await renderComponentToString(
					result,
					vnode.type.name,
					vnode.type,
					props,
					slots,
				);
				const html = markHTMLString(str);
				return html;
			}
			case !vnode.type && vnode.type !== 0:
				return '';
			case typeof vnode.type === 'string' && vnode.type !== ClientOnlyPlaceholder:
				return markHTMLString(await renderElement(result, vnode.type, vnode.props ?? {}));
		}
		if (vnode.type) {
			let extractSlots2 = function (child) {
				if (Array.isArray(child)) {
					return child.map((c) => extractSlots2(c));
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
			};
			var extractSlots = extractSlots2;
			if (typeof vnode.type === 'function' && vnode.props['server:root']) {
				const output2 = await vnode.type(vnode.props ?? {});
				return await renderJSX(result, output2);
			}
			if (typeof vnode.type === 'function') {
				if (vnode.props[hasTriedRenderComponentSymbol]) {
					delete vnode.props[hasTriedRenderComponentSymbol];
					const output2 = await vnode.type(vnode.props ?? {});
					if (output2?.[AstroJSX] || !output2) {
						return await renderJSXVNode(result, output2);
					} else {
						return;
					}
				} else {
					vnode.props[hasTriedRenderComponentSymbol] = true;
				}
			}
			const { children = null, ...props } = vnode.props ?? {};
			const _slots = {
				default: [],
			};
			extractSlots2(children);
			for (const [key, value] of Object.entries(props)) {
				if (value?.['$$slot']) {
					_slots[key] = value;
					delete props[key];
				}
			}
			const slotPromises = [];
			const slots = {};
			for (const [key, value] of Object.entries(_slots)) {
				slotPromises.push(
					renderJSX(result, value).then((output2) => {
						if (output2.toString().trim().length === 0) return;
						slots[key] = () => output2;
					}),
				);
			}
			await Promise.all(slotPromises);
			let output;
			if (vnode.type === ClientOnlyPlaceholder && vnode.props['client:only']) {
				output = await renderComponentToString(
					result,
					vnode.props['client:display-name'] ?? '',
					null,
					props,
					slots,
				);
			} else {
				output = await renderComponentToString(
					result,
					typeof vnode.type === 'function' ? vnode.type.name : vnode.type,
					vnode.type,
					props,
					slots,
				);
			}
			return markHTMLString(output);
		}
	}
	return markHTMLString(`${vnode}`);
}
async function renderElement(result, tag, { children, ...props }) {
	return markHTMLString(
		`<${tag}${spreadAttributes(props)}${markHTMLString(
			(children == null || children === '') && voidElementNames.test(tag)
				? `/>`
				: `>${children == null ? '' : await renderJSX(result, prerenderElementChildren(tag, children))}</${tag}>`,
		)}`,
	);
}
function prerenderElementChildren(tag, children) {
	if (typeof children === 'string' && (tag === 'style' || tag === 'script')) {
		return markHTMLString(children);
	} else {
		return children;
	}
}
export { renderJSX };

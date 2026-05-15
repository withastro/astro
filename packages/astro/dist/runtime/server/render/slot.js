import { HTMLString, markHTMLString, unescapeHTML } from '../escape.js';
import { renderChild } from './any.js';
import { renderTemplate } from './astro/render-template.js';
import { chunkToString } from './common.js';
const slotString = /* @__PURE__ */ Symbol.for('astro:slot-string');
class SlotString extends HTMLString {
	instructions;
	[slotString];
	constructor(content, instructions) {
		super(content);
		this.instructions = instructions;
		this[slotString] = true;
	}
}
function isSlotString(str) {
	return !!str[slotString];
}
function mergeSlotInstructions(target, source) {
	if (source.instructions?.length) {
		target ??= [];
		target.push(...source.instructions);
	}
	return target;
}
function renderSlot(result, slotted, fallback) {
	if (!slotted && fallback) {
		return renderSlot(result, fallback);
	}
	return {
		async render(destination) {
			await renderChild(destination, typeof slotted === 'function' ? slotted(result) : slotted);
		},
	};
}
async function renderSlotToString(result, slotted, fallback) {
	let content = '';
	let instructions = null;
	const temporaryDestination = {
		write(chunk) {
			if (chunk instanceof SlotString) {
				content += chunk;
				instructions = mergeSlotInstructions(instructions, chunk);
			} else if (chunk instanceof Response) return;
			else if (typeof chunk === 'object' && 'type' in chunk && typeof chunk.type === 'string') {
				if (instructions === null) {
					instructions = [];
				}
				instructions.push(chunk);
			} else {
				content += chunkToString(result, chunk);
			}
		},
	};
	const renderInstance = renderSlot(result, slotted, fallback);
	await renderInstance.render(temporaryDestination);
	return markHTMLString(new SlotString(content, instructions));
}
async function renderSlots(result, slots = {}) {
	let slotInstructions = null;
	let children = {};
	if (slots) {
		await Promise.all(
			Object.entries(slots).map(([key, value]) =>
				renderSlotToString(result, value).then((output) => {
					if (output.instructions) {
						if (slotInstructions === null) {
							slotInstructions = [];
						}
						slotInstructions.push(...output.instructions);
					}
					children[key] = output;
				}),
			),
		);
	}
	return { slotInstructions, children };
}
function createSlotValueFromString(content) {
	return function () {
		return renderTemplate`${unescapeHTML(content)}`;
	};
}
export {
	SlotString,
	createSlotValueFromString,
	isSlotString,
	mergeSlotInstructions,
	renderSlot,
	renderSlotToString,
	renderSlots,
};

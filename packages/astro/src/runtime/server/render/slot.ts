import type { SSRResult } from '../../../types/public/internal.js';
import { HTMLString, markHTMLString, unescapeHTML } from '../escape.js';
import { renderChild } from './any.js';
import { renderTemplate } from './astro/render-template.js';
import { chunkToString, type RenderDestination, type RenderInstance } from './common.js';
import type { RenderInstruction } from './instruction.js';

type RenderTemplateResult = ReturnType<typeof renderTemplate>;
export type ComponentSlots = Record<string, ComponentSlotValue>;
export type ComponentSlotValue = (
	result: SSRResult,
) => RenderTemplateResult | Promise<RenderTemplateResult>;

const slotString = Symbol.for('astro:slot-string');

export class SlotString extends HTMLString {
	public instructions: null | RenderInstruction[];
	public [slotString]: boolean;
	constructor(content: string, instructions: null | RenderInstruction[]) {
		super(content);
		this.instructions = instructions;
		this[slotString] = true;
	}
}

export function isSlotString(str: string): str is any {
	return !!(str as any)[slotString];
}

/**
 * Collects instructions from a SlotString into the target array.
 * Returns the (possibly newly created) instructions array.
 */
export function mergeSlotInstructions(
	target: RenderInstruction[] | null,
	source: SlotString,
): RenderInstruction[] | null {
	if (source.instructions?.length) {
		target ??= [];
		target.push(...source.instructions);
	}
	return target;
}

export function renderSlot(
	result: SSRResult,
	slotted: ComponentSlotValue | RenderTemplateResult,
	fallback?: ComponentSlotValue | RenderTemplateResult,
): RenderInstance {
	if (!slotted && fallback) {
		return renderSlot(result, fallback);
	}
	return {
		async render(destination) {
			await renderChild(destination, typeof slotted === 'function' ? slotted(result) : slotted);
		},
	};
}

export async function renderSlotToString(
	result: SSRResult,
	slotted: ComponentSlotValue | RenderTemplateResult,
	fallback?: ComponentSlotValue | RenderTemplateResult,
): Promise<string> {
	let content = '';
	let instructions: null | RenderInstruction[] = null;
	const temporaryDestination: RenderDestination = {
		write(chunk) {
			// if the chunk is already a SlotString, we concatenate
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

interface RenderSlotsResult {
	slotInstructions: null | RenderInstruction[];
	children: Record<string, string>;
}

export async function renderSlots(
	result: SSRResult,
	slots: ComponentSlots = {},
): Promise<RenderSlotsResult> {
	let slotInstructions: RenderSlotsResult['slotInstructions'] = null;
	let children: RenderSlotsResult['children'] = {};
	if (slots) {
		await Promise.all(
			Object.entries(slots).map(([key, value]) =>
				renderSlotToString(result, value).then((output: any) => {
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

export function createSlotValueFromString(content: string): ComponentSlotValue {
	return function () {
		return renderTemplate`${unescapeHTML(content)}`;
	};
}

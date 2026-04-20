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
	public scriptInstructions: null | Map<string, RenderInstruction>;
	public [slotString]: boolean;
	constructor(
		content: string,
		instructions: null | RenderInstruction[],
		scriptInstructions?: null | Map<string, RenderInstruction>,
	) {
		super(content);
		this.instructions = instructions;
		this.scriptInstructions = scriptInstructions ?? null;
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

/**
 * Collects script instructions from a SlotString into the target map.
 * Returns the (possibly newly created) script instructions map.
 */
export function mergeSlotScriptInstructions(
	target: Map<string, RenderInstruction> | null,
	source: SlotString,
): Map<string, RenderInstruction> | null {
	if (source.scriptInstructions?.size) {
		target ??= new Map();
		for (const [key, value] of source.scriptInstructions) {
			target.set(key, value);
		}
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
	let scriptInstructions: null | Map<string, RenderInstruction> = null;
	let scriptIndex = 0;
	const temporaryDestination: RenderDestination = {
		write(chunk) {
			// if the chunk is already a SlotString, we concatenate
			if (chunk instanceof SlotString) {
				content += chunk;
				instructions = mergeSlotInstructions(instructions, chunk);
				scriptInstructions = mergeSlotScriptInstructions(scriptInstructions, chunk);
			} else if (chunk instanceof Response) return;
			else if (typeof chunk === 'object' && 'type' in chunk && typeof chunk.type === 'string') {
				// Script instructions need positional handling — embed a placeholder
				// in the content stream so they render at their original position
				// instead of being hoisted to the top of the slot output.
				if (chunk.type === 'script') {
					const placeholder = `<!--astro:script:${scriptIndex++}-->`;
					scriptInstructions ??= new Map();
					scriptInstructions.set(placeholder, chunk);
					content += placeholder;
				} else {
					instructions ??= [];
					instructions.push(chunk);
				}
			} else {
				content += chunkToString(result, chunk);
			}
		},
	};
	const renderInstance = renderSlot(result, slotted, fallback);
	await renderInstance.render(temporaryDestination);
	return markHTMLString(new SlotString(content, instructions, scriptInstructions));
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

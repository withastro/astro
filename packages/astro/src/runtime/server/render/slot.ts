import type { SSRResult } from '../../../types/public/internal.js';
import { HTMLString, markHTMLString, unescapeHTML } from '../escape.js';
import { renderChild } from './any.js';
import { renderTemplate } from './astro/render-template.js';
import { chunkToString, type RenderDestination, type RenderInstance } from './common.js';
import type { RenderInstruction, RenderScriptInstruction } from './instruction.js';

type RenderTemplateResult = ReturnType<typeof renderTemplate>;
export type ComponentSlots = Record<string, ComponentSlotValue>;
export type ComponentSlotValue = (
	result: SSRResult,
) => RenderTemplateResult | Promise<RenderTemplateResult>;

const slotString = Symbol.for('astro:slot-string');

export class SlotString extends HTMLString {
	public instructions: null | RenderInstruction[];
	public scriptInstructions: null | Map<string, RenderScriptInstruction>;
	public [slotString]: boolean;
	constructor(
		content: string,
		instructions: null | RenderInstruction[],
		scriptInstructions?: null | Map<string, RenderScriptInstruction>,
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
	let scriptInstructions: null | Map<string, RenderScriptInstruction> = null;
	let scriptPlaceholderIndex = 0;
	const temporaryDestination: RenderDestination = {
		write(chunk) {
			// if the chunk is already a SlotString, we concatenate
			if (chunk instanceof SlotString) {
				// If the nested SlotString has script instruction placeholders,
				// merge them into our own map (the placeholders are already embedded in the content)
				if (chunk.scriptInstructions?.size) {
					scriptInstructions ??= new Map();
					for (const [key, value] of chunk.scriptInstructions) {
						scriptInstructions.set(key, value);
					}
				}
				content += chunk;
				instructions = mergeSlotInstructions(instructions, chunk);
			} else if (chunk instanceof Response) return;
			else if (typeof chunk === 'object' && 'type' in chunk && typeof chunk.type === 'string') {
				if (chunk.type === 'script') {
					// Script instructions are position-sensitive. Instead of adding them
					// to the instructions array (which renders them before all content),
					// embed a placeholder in the content string and store the instruction
					// for later replacement. This preserves the script's position in the
					// content stream while deferring deduplication to stringification time.
					const placeholder = `<!--astro:script:${scriptPlaceholderIndex++}-->`;
					content += placeholder;
					scriptInstructions ??= new Map();
					scriptInstructions.set(placeholder, chunk as RenderScriptInstruction);
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

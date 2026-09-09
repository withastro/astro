import type { SSRResult } from '../../../types/public/internal.js';
import { HTMLString, markHTMLString, unescapeHTML } from '../escape.js';
import { renderChild } from './any.js';
import { renderTemplate } from './astro/render-template.js';
import { chunkToString, type RenderDestination, type RenderInstance } from './common.js';
import {
	isScriptInstruction,
	type RenderInstruction,
	type RenderScriptInstruction,
} from './instruction.js';

type RenderTemplateResult = ReturnType<typeof renderTemplate>;
export type ComponentSlots = Record<string, ComponentSlotValue>;
export type ComponentSlotValue = (
	result: SSRResult,
) => RenderTemplateResult | Promise<RenderTemplateResult>;

const slotString = Symbol.for('astro:slot-string');

/**
 * A part of a slot's content stream: either already-stringified HTML or a
 * position-sensitive script instruction that is resolved (and deduplicated)
 * lazily when the slot is finally stringified.
 */
export type SlotStringChunk = string | RenderScriptInstruction;

export class SlotString extends HTMLString {
	public instructions: null | RenderInstruction[];
	/**
	 * The slot's content as an ordered stream. Unlike `instructions` (which holds
	 * position-independent instructions like head/hydration content), scripts are
	 * kept inline here so they render at their original position instead of being
	 * hoisted to the start of the slot output.
	 */
	public chunks: SlotStringChunk[];
	public [slotString]: boolean;
	constructor(
		content: string,
		instructions: null | RenderInstruction[],
		chunks: SlotStringChunk[] = [],
	) {
		super(content);
		this.instructions = instructions;
		this.chunks = chunks;
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
	const chunks: SlotStringChunk[] = [];
	const temporaryDestination: RenderDestination = {
		write(chunk) {
			// if the chunk is already a SlotString, we concatenate
			if (chunk instanceof SlotString) {
				content += chunk;
				// Preserve nested content (including its scripts) in order.
				if (chunk.chunks.length) {
					chunks.push(...chunk.chunks);
				}
				instructions = mergeSlotInstructions(instructions, chunk);
			} else if (chunk instanceof Response) return;
			else if (typeof chunk === 'object' && 'type' in chunk && typeof chunk.type === 'string') {
				// Scripts are position-sensitive, so keep them inline in the content
				// stream at their original location. Other instructions (head,
				// hydration, etc.) are position-independent and bubble up separately.
				if (isScriptInstruction(chunk)) {
					chunks.push(chunk);
				} else {
					if (instructions === null) {
						instructions = [];
					}
					instructions.push(chunk);
				}
			} else {
				const str = chunkToString(result, chunk);
				content += str;
				chunks.push(str);
			}
		},
	};
	const renderInstance = renderSlot(result, slotted, fallback);
	await renderInstance.render(temporaryDestination);
	return markHTMLString(new SlotString(content, instructions, chunks));
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
					// Framework/`.html` components inline slot content as an opaque
					// string, so the inline scripts kept in `chunks` would be lost.
					// Surface them here so they still render (deduplicated at output).
					if (output.chunks) {
						for (const part of output.chunks as SlotStringChunk[]) {
							if (typeof part !== 'string') {
								if (slotInstructions === null) {
									slotInstructions = [];
								}
								slotInstructions.push(part);
							}
						}
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

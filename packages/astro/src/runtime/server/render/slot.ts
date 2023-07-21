import type { SSRResult } from '../../../@types/astro.js';
import type { renderTemplate } from './astro/render-template.js';
import type { RenderInstruction } from './types.js';

import { HTMLString, markHTMLString } from '../escape.js';
import { renderChild } from './any.js';
import type { RenderDestination } from './common.js';

type RenderTemplateResult = ReturnType<typeof renderTemplate>;
export type ComponentSlots = Record<string, ComponentSlotValue>;
export type ComponentSlotValue = (
	result: SSRResult
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

export async function renderSlot(
	result: SSRResult,
	slotted: ComponentSlotValue | RenderTemplateResult,
	fallback?: ComponentSlotValue | RenderTemplateResult
): Promise<void> {
	if (slotted) {
		await renderChild(
			result.destination,
			typeof slotted === 'function' ? slotted(result) : slotted
		);
	} else if (fallback) {
		await renderSlot(result, fallback);
	}
}

export async function renderSlotToString(
	result: SSRResult,
	slotted: ComponentSlotValue | RenderTemplateResult,
	fallback?: ComponentSlotValue | RenderTemplateResult
): Promise<string> {
	let content = '';
	let instructions: null | RenderInstruction[] = null;
	const temporaryDestination: RenderDestination = {
		// TODO: Revist this chunk type
		write(chunk: string | RenderInstruction) {
			if (typeof chunk === 'object' && typeof chunk.type === 'string') {
				if (instructions === null) {
					instructions = [];
				}
				instructions.push(chunk);
			} else {
				content += chunk;
			}
		},
	};
	const temporaryResult = {
		...result,
		destination: temporaryDestination,
	};
	await renderSlot(temporaryResult, slotted, fallback);
	return markHTMLString(new SlotString(content, instructions));
}

interface RenderSlotsResult {
	slotInstructions: null | RenderInstruction[];
	children: Record<string, string>;
}

export async function renderSlots(
	result: SSRResult,
	slots: ComponentSlots = {}
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
				})
			)
		);
	}
	return { slotInstructions, children };
}

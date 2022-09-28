import type { SSRResult } from '../../../@types/astro.js';
import type { RenderInstruction } from './types.js';

import { HTMLString, markHTMLString } from '../escape.js';
import { renderChild } from './any.js';

export class SlotString extends HTMLString {
	public instructions: null | RenderInstruction[];
	constructor(content: string, instructions: null | RenderInstruction[]) {
		super(content);
		this.instructions = instructions;
	}
}

export async function renderSlot(_result: any, slotted: string, fallback?: any): Promise<string> {
	if (slotted) {
		let iterator = renderChild(slotted);
		let content = '';
		let instructions: null | RenderInstruction[] = null;
		for await (const chunk of iterator) {
			if ((chunk as any).type === 'directive') {
				if (instructions === null) {
					instructions = [];
				}
				instructions.push(chunk);
			} else {
				content += chunk;
			}
		}
		return markHTMLString(new SlotString(content, instructions));
	}
	return fallback;
}

interface RenderSlotsResult {
	slotInstructions: null | RenderInstruction[];
	children: Record<string, string>;
}

export async function renderSlots(result: SSRResult, slots: any = {}): Promise<RenderSlotsResult> {
	let slotInstructions: RenderSlotsResult['slotInstructions'] = null;
	let children: RenderSlotsResult['children'] = {};
	if (slots) {
		await Promise.all(
			Object.entries(slots).map(([key, value]) =>
				renderSlot(result, value as string).then((output: any) => {
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

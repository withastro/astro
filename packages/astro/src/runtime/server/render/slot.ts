import type { SSRResult } from '../../../@types/astro.js';
import type { RenderInstruction } from './types.js';
import type { renderTemplate } from './astro/render-template.js';

import { HTMLString, markHTMLString } from '../escape.js';
import { renderChild } from './any.js';
import { ScopeFlags, addScopeFlag, removeScopeFlag, createScopedResult } from './scope.js';

export type ComponentSlots = Record<string, ComponentSlotValue>;
export type ComponentSlotValue = (result: SSRResult) => ReturnType<typeof renderTemplate>;

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
	slotted: ComponentSlotValue,
	fallback?: ComponentSlotValue
): Promise<string> {
	if (slotted) {
		const scoped = createScopedResult(result, ScopeFlags.Slot);
		let iterator = renderChild(slotted(scoped));
		let content = '';
		let instructions: null | RenderInstruction[] = null;
		for await (const chunk of iterator) {
			if (typeof (chunk as any).type === 'string') {
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

	if(fallback) {
		return renderSlot(result, fallback);
	}
	return '';
}

interface RenderSlotsResult {
	slotInstructions: null | RenderInstruction[];
	children: Record<string, string>;
}

export async function renderSlots(result: SSRResult, slots: ComponentSlots = {}): Promise<RenderSlotsResult> {
	let slotInstructions: RenderSlotsResult['slotInstructions'] = null;
	let children: RenderSlotsResult['children'] = {};
	if (slots) {
		await Promise.all(
			Object.entries(slots).map(([key, value]) =>
				renderSlot(result, value).then((output: any) => {
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

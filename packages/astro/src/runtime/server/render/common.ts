import type { SSRResult } from '../../../@types/astro';
import type { RenderInstruction } from './types.js';

import { HTMLBytes, markHTMLString } from '../escape.js';
import {
	determineIfNeedsHydrationScript,
	determinesIfNeedsDirectiveScript,
	getPrescripts,
	type PrescriptType,
} from '../scripts.js';
import { renderAllHeadContent } from './head.js';
import { isSlotString, type SlotString } from './slot.js';

export interface RenderDestination {
	/**
	 * Any rendering logic should call this to construct the HTML output.
	 * See the `chunk` parameter for possible writable values
	 */
	write(chunk: string | HTMLBytes | RenderInstruction | Response): void;
}

export const Fragment = Symbol.for('astro:fragment');
export const Renderer = Symbol.for('astro:renderer');

export const encoder = new TextEncoder();
export const decoder = new TextDecoder();

// Rendering produces either marked strings of HTML or instructions for hydration.
// These directive instructions bubble all the way up to renderPage so that we
// can ensure they are added only once, and as soon as possible.
export function stringifyChunk(
	result: SSRResult,
	chunk: string | SlotString | RenderInstruction
): string {
	if (typeof (chunk as any).type === 'string') {
		const instruction = chunk as RenderInstruction;
		switch (instruction.type) {
			case 'directive': {
				const { hydration } = instruction;
				let needsHydrationScript = hydration && determineIfNeedsHydrationScript(result);
				let needsDirectiveScript =
					hydration && determinesIfNeedsDirectiveScript(result, hydration.directive);

				let prescriptType: PrescriptType = needsHydrationScript
					? 'both'
					: needsDirectiveScript
					? 'directive'
					: null;
				if (prescriptType) {
					let prescripts = getPrescripts(result, prescriptType, hydration.directive);
					return markHTMLString(prescripts);
				} else {
					return '';
				}
			}
			case 'head': {
				if (result._metadata.hasRenderedHead) {
					return '';
				}
				return renderAllHeadContent(result);
			}
			case 'maybe-head': {
				if (result._metadata.hasRenderedHead || result._metadata.headInTree) {
					return '';
				}
				return renderAllHeadContent(result);
			}
			default: {
				if (chunk instanceof Response) {
					return '';
				}
				throw new Error(`Unknown chunk type: ${(chunk as any).type}`);
			}
		}
	} else {
		if (isSlotString(chunk as string)) {
			let out = '';
			const c = chunk as SlotString;
			if (c.instructions) {
				for (const instr of c.instructions) {
					out += stringifyChunk(result, instr);
				}
			}
			out += chunk.toString();
			return out;
		}

		return chunk.toString();
	}
}

export class HTMLParts {
	public parts: string;
	constructor() {
		this.parts = '';
	}
	append(part: string | HTMLBytes | RenderInstruction, result: SSRResult) {
		if (ArrayBuffer.isView(part)) {
			this.parts += decoder.decode(part);
		} else {
			this.parts += stringifyChunk(result, part);
		}
	}
	toString() {
		return this.parts;
	}
	toArrayBuffer() {
		return encoder.encode(this.parts);
	}
}

export function chunkToString(result: SSRResult, chunk: string | HTMLBytes | RenderInstruction) {
	if (ArrayBuffer.isView(chunk)) {
		return decoder.decode(chunk);
	} else {
		return stringifyChunk(result, chunk);
	}
}

export function chunkToByteArray(
	result: SSRResult,
	chunk: string | HTMLBytes | RenderInstruction
): Uint8Array {
	if (ArrayBuffer.isView(chunk)) {
		return chunk as Uint8Array;
	} else {
		// `stringifyChunk` might return a HTMLString, call `.toString()` to really ensure it's a string
		const stringified = stringifyChunk(result, chunk);
		return encoder.encode(stringified.toString());
	}
}

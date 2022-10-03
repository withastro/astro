import type { SSRResult } from '../../../@types/astro';
import type { RenderInstruction } from './types.js';

import { HTMLBytes, markHTMLString } from '../escape.js';
import {
	determineIfNeedsHydrationScript,
	determinesIfNeedsDirectiveScript,
	getPrescripts,
	PrescriptType,
} from '../scripts.js';

export const Fragment = Symbol.for('astro:fragment');
export const Renderer = Symbol.for('astro:renderer');

export const encoder = new TextEncoder();
export const decoder = new TextDecoder();

// Rendering produces either marked strings of HTML or instructions for hydration.
// These directive instructions bubble all the way up to renderPage so that we
// can ensure they are added only once, and as soon as possible.
export function stringifyChunk(result: SSRResult, chunk: string | RenderInstruction) {
	switch ((chunk as any).type) {
		case 'directive': {
			const { hydration } = chunk as RenderInstruction;
			let needsHydrationScript = hydration && determineIfNeedsHydrationScript(result);
			let needsDirectiveScript =
				hydration && determinesIfNeedsDirectiveScript(result, hydration.directive);

			let prescriptType: PrescriptType = needsHydrationScript
				? 'both'
				: needsDirectiveScript
				? 'directive'
				: null;
			if (prescriptType) {
				let prescripts = getPrescripts(prescriptType, hydration.directive);
				return markHTMLString(prescripts);
			} else {
				return '';
			}
		}
		default: {
			return chunk.toString();
		}
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

export function chunkToByteArray(
	result: SSRResult,
	chunk: string | HTMLBytes | RenderInstruction
): Uint8Array {
	if (chunk instanceof Uint8Array) {
		return chunk as Uint8Array;
	}
	return encoder.encode(stringifyChunk(result, chunk));
}

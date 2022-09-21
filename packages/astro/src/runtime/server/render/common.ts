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
	public parts: Array<HTMLBytes | string>;
	constructor() {
		this.parts = [];
	}
	append(part: string | HTMLBytes | RenderInstruction, result: SSRResult) {
		if (ArrayBuffer.isView(part)) {
			this.parts.push(part);
		} else {
			this.parts.push(stringifyChunk(result, part));
		}
	}
	toString() {
		let html = '';
		for (const part of this.parts) {
			if (ArrayBuffer.isView(part)) {
				html += decoder.decode(part);
			} else {
				html += part;
			}
		}
		return html;
	}
	toArrayBuffer() {
		this.parts.forEach((part, i) => {
			if (typeof part === 'string') {
				this.parts[i] = encoder.encode(String(part));
			}
		});
		return concatUint8Arrays(this.parts as Uint8Array[]);
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

export function concatUint8Arrays(arrays: Array<Uint8Array>) {
	let len = 0;
	arrays.forEach((arr) => (len += arr.length));
	let merged = new Uint8Array(len);
	let offset = 0;
	arrays.forEach((arr) => {
		merged.set(arr, offset);
		offset += arr.length;
	});
	return merged;
}

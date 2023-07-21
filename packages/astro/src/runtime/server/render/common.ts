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

/**
 * Possible chunk types to be written to the destination, and it'll
 * handle stringifying them at the end.
 */
export type RenderDestinationChunk =
	| string
	| HTMLBytes
	| ArrayBufferView
	| RenderInstruction
	| Response;

export interface RenderDestination {
	/**
	 * Any rendering logic should call this to construct the HTML output.
	 * See the `chunk` parameter for possible writable values.
	 */
	write(chunk: RenderDestinationChunk): void;
}

export const Fragment = Symbol.for('astro:fragment');
export const Renderer = Symbol.for('astro:renderer');

export const encoder = new TextEncoder();
export const decoder = new TextDecoder();

// Rendering produces either marked strings of HTML or instructions for hydration.
// These directive instructions bubble all the way up to renderPage so that we
// can ensure they are added only once, and as soon as possible.
function stringifyChunk(result: SSRResult, chunk: string | SlotString | RenderInstruction): string {
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

export function chunkToString(result: SSRResult, chunk: Exclude<RenderDestinationChunk, Response>) {
	if (ArrayBuffer.isView(chunk)) {
		return decoder.decode(chunk);
	} else {
		return stringifyChunk(result, chunk);
	}
}

export function chunkToByteArray(
	result: SSRResult,
	chunk: Exclude<RenderDestinationChunk, Response>
): Uint8Array {
	if (ArrayBuffer.isView(chunk)) {
		return chunk as Uint8Array;
	} else {
		// stringify chunk might return a HTMLString
		return encoder.encode(stringifyChunk(result, chunk));
	}
}

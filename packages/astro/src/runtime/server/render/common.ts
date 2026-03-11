import type { SSRResult } from '../../../types/public/internal.js';
import type { HTMLBytes, HTMLString } from '../escape.js';
import { markHTMLString } from '../escape.js';
import {
	determineIfNeedsHydrationScript,
	determinesIfNeedsDirectiveScript,
	getPrescripts,
} from '../scripts.js';
import { renderAllHeadContent } from './head.js';
import type { RenderInstruction } from './instruction.js';
import { isRenderInstruction } from './instruction.js';
import { renderServerIslandRuntime } from './server-islands.js';
import { isSlotString, type SlotString } from './slot.js';

/**
 * Possible chunk types to be written to the destination, and it'll
 * handle stringifying them at the end.
 *
 * NOTE: Try to reduce adding new types here. If possible, serialize
 * the custom types to a string in `renderChild` in `any.ts`.
 */
export type RenderDestinationChunk =
	| string
	| HTMLBytes
	| HTMLString
	| SlotString
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

export interface RenderInstance {
	render: RenderFunction;
}

export type RenderFunction = (destination: RenderDestination) => Promise<void> | void;

export const Fragment = Symbol.for('astro:fragment');
export const Renderer = Symbol.for('astro:renderer');

export const encoder = new TextEncoder();
export const decoder = new TextDecoder();

// Rendering produces either marked strings of HTML or instructions for hydration.
// These directive instructions bubble all the way up to renderPage so that we
// can ensure they are added only once, and as soon as possible.
export function stringifyChunk(
	result: SSRResult,
	chunk: string | HTMLString | SlotString | RenderInstruction,
): string {
	// Fast path: plain string primitives are the most common chunk type
	// (text expressions like escapeHTML output).  `typeof` is a single
	// type-tag comparison — much cheaper than the symbol/instanceof checks
	// below.  HTMLString and SlotString are objects, not primitives, so
	// they correctly fall through.
	if (typeof chunk === 'string') return chunk;

	if (isRenderInstruction(chunk)) {
		const instruction = chunk;
		switch (instruction.type) {
			case 'directive': {
				const { hydration } = instruction;
				let needsHydrationScript = hydration && determineIfNeedsHydrationScript(result);
				let needsDirectiveScript =
					hydration && determinesIfNeedsDirectiveScript(result, hydration.directive);

				if (needsHydrationScript) {
					let prescripts = getPrescripts(result, 'both', hydration.directive);
					return markHTMLString(prescripts);
				} else if (needsDirectiveScript) {
					let prescripts = getPrescripts(result, 'directive', hydration.directive);
					return markHTMLString(prescripts);
				} else {
					return '';
				}
			}
			case 'head': {
				if (result._metadata.hasRenderedHead || result.partial) {
					return '';
				}
				return renderAllHeadContent(result);
			}
			case 'maybe-head': {
				if (result._metadata.hasRenderedHead || result._metadata.headInTree || result.partial) {
					return '';
				}
				return renderAllHeadContent(result);
			}
			case 'renderer-hydration-script': {
				const { rendererSpecificHydrationScripts } = result._metadata;
				const { rendererName } = instruction;

				if (!rendererSpecificHydrationScripts.has(rendererName)) {
					rendererSpecificHydrationScripts.add(rendererName);
					return instruction.render();
				}
				return '';
			}
			case 'server-island-runtime': {
				if (result._metadata.hasRenderedServerIslandRuntime) {
					return '';
				}
				result._metadata.hasRenderedServerIslandRuntime = true;
				return renderServerIslandRuntime();
			}
			case 'script': {
				const { id, content } = instruction;
				if (result._metadata.renderedScripts.has(id)) {
					return '';
				}
				result._metadata.renderedScripts.add(id);
				return content;
			}
			default: {
				throw new Error(`Unknown chunk type: ${(chunk as any).type}`);
			}
		}
	} else if (chunk instanceof Response) {
		return '';
	} else if (isSlotString(chunk as unknown as string)) {
		let out = '';
		const c = chunk as unknown as SlotString;
		if (c.instructions) {
			for (const instr of c.instructions) {
				out += stringifyChunk(result, instr);
			}
		}
		out += (chunk as unknown as SlotString).toString();
		return out;
	}

	return (chunk as unknown as HTMLString).toString();
}

export function chunkToString(result: SSRResult, chunk: Exclude<RenderDestinationChunk, Response>) {
	if (ArrayBuffer.isView(chunk)) {
		// Fast path: the compiler attaches a cached `_str` property to
		// pre-encoded Uint8Array static parts ($$sN), avoiding decoder.decode()
		// on every render.  Falls back to decoder.decode() for dynamically
		// created ArrayBufferViews.
		return (chunk as any)._str ?? ((chunk as any)._str = decoder.decode(chunk));
	} else {
		return stringifyChunk(result, chunk);
	}
}

export function chunkToByteArray(
	result: SSRResult,
	chunk: Exclude<RenderDestinationChunk, Response>,
): Uint8Array {
	if (ArrayBuffer.isView(chunk)) {
		return chunk as Uint8Array;
	} else {
		// `stringifyChunk` might return a HTMLString, call `.toString()` to really ensure it's a string
		const stringified = stringifyChunk(result, chunk);
		return encoder.encode(stringified.toString());
	}
}

export function chunkToByteArrayOrString(
	result: SSRResult,
	chunk: Exclude<RenderDestinationChunk, Response>,
): Uint8Array | string {
	if (ArrayBuffer.isView(chunk)) {
		// Pre-encoded static parts from the Rust compiler carry a cached ._str.
		// For small chunks (typical HTML tags), returning the string lets the
		// streaming merge loop batch them via V8 rope concat + one encode() —
		// dramatically faster than Buffer.concat of thousands of tiny arrays.
		// Large chunks (e.g. static-heavy's 50KB blob) stay as Uint8Array for
		// zero-copy efficiency.
		const cached = (chunk as any)._str;
		if (cached !== undefined && (chunk as Uint8Array).byteLength <= 256) return cached;
		return chunk as Uint8Array;
	} else {
		// stringifyChunk may return an HTMLString (from markHTMLString in render
		// instructions).  Call .toString() to ensure a primitive string so the
		// streaming merge loop can correctly identify string vs Uint8Array entries.
		return stringifyChunk(result, chunk).toString();
	}
}

export function isRenderInstance(obj: unknown): obj is RenderInstance {
	return !!obj && typeof obj === 'object' && 'render' in obj && typeof obj.render === 'function';
}

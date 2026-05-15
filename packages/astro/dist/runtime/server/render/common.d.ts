import type { SSRResult } from '../../../types/public/internal.js';
import type { HTMLBytes, HTMLString } from '../escape.js';
import type { RenderInstruction } from './instruction.js';
import { type SlotString } from './slot.js';
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
export declare const Fragment: unique symbol;
export declare const Renderer: unique symbol;
export declare const encoder: TextEncoder;
export declare const decoder: TextDecoder;
export declare function chunkToString(
	result: SSRResult,
	chunk: Exclude<RenderDestinationChunk, Response>,
): string;
export declare function chunkToByteArray(
	result: SSRResult,
	chunk: Exclude<RenderDestinationChunk, Response>,
): Uint8Array;
export declare function chunkToByteArrayOrString(
	result: SSRResult,
	chunk: Exclude<RenderDestinationChunk, Response>,
): Uint8Array | string;
export declare function isRenderInstance(obj: unknown): obj is RenderInstance;

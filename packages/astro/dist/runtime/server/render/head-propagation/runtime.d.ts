import { type HeadInstructionRenderState } from '../../../../core/head-propagation/policy.js';
import type { SSRResult } from '../../../../types/public/internal.js';
import type { AstroComponentFactory } from '../astro/factory.js';
/** Facade helper used by runtime adapters to read effective hint resolution. */
export declare function getPropagationHint(
	result: SSRResult,
	factory: AstroComponentFactory,
): import('../../../../types/public/internal.js').PropagationHint;
/**
 * Registers an instance in the propagation set when its hint requires buffering.
 *
 * @example
 * A runtime-created component with `propagation: 'self'` is registered so its
 * styles can be collected before head flush.
 */
export declare function registerIfPropagating(
	result: SSRResult,
	factory: AstroComponentFactory,
	instance: {
		init(result: SSRResult): unknown | Promise<unknown>;
	},
): void;
export declare function bufferPropagatedHead(result: SSRResult): Promise<void>;
/** Facade helper for render instruction gating (`head` vs `maybe-head`). */
export declare function shouldRenderInstruction(
	type: 'head' | 'maybe-head',
	state: HeadInstructionRenderState,
): boolean;
/** Projects `SSRResult` into the minimal state needed by instruction policy. */
export declare function getInstructionRenderState(result: SSRResult): HeadInstructionRenderState;

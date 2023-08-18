import type { HydrationMetadata } from '../hydration.js';

const RenderInstructionSymbol = Symbol.for('astro:render');

export type RenderDirectiveInstruction = {
	type: 'directive';
	hydration: HydrationMetadata;
};

export type RenderHeadInstruction = {
	type: 'head';
};

export type MaybeRenderHeadInstruction = {
	type: 'maybe-head';
};

export type RenderInstruction =
	| RenderDirectiveInstruction
	| RenderHeadInstruction
	| MaybeRenderHeadInstruction;

export function createRenderInstruction(
	instruction: RenderDirectiveInstruction
): RenderDirectiveInstruction;
export function createRenderInstruction(instruction: RenderHeadInstruction): RenderHeadInstruction;
export function createRenderInstruction(
	instruction: MaybeRenderHeadInstruction
): MaybeRenderHeadInstruction;
export function createRenderInstruction(instruction: { type: string }): RenderInstruction {
	return Object.defineProperty(instruction as RenderInstruction, RenderInstructionSymbol, {
		value: true,
	});
}

export function isRenderInstruction(chunk: any): chunk is RenderInstruction {
	return chunk && typeof chunk === 'object' && chunk[RenderInstructionSymbol];
}

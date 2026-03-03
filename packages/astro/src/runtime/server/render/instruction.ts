import type { HydrationMetadata } from '../hydration.js';

const RenderInstructionSymbol = Symbol.for('astro:render');

export type RenderDirectiveInstruction = {
	type: 'directive';
	hydration: HydrationMetadata;
};

export type RenderHeadInstruction = {
	type: 'head';
};

/**
 * Render a renderer-specific hydration script before the first component of that
 * framework
 */
export type RendererHydrationScriptInstruction = {
	type: 'renderer-hydration-script';
	rendererName: string;
	render: () => string;
};

export type MaybeRenderHeadInstruction = {
	type: 'maybe-head';
};

export type ServerIslandRuntimeInstruction = {
	type: 'server-island-runtime';
};

export type RenderScriptInstruction = {
	type: 'script';
	id: string;
	content: string;
};

export type RenderInstruction =
	| RenderDirectiveInstruction
	| RenderHeadInstruction
	| MaybeRenderHeadInstruction
	| RendererHydrationScriptInstruction
	| ServerIslandRuntimeInstruction
	| RenderScriptInstruction;

// Shared prototype carrying the render-instruction symbol brand.
// All instruction objects inherit from this via Object.create() instead of
// getting a per-instance Object.defineProperty() call.  This is significantly
// faster in V8: Object.create + Object.assign avoids the descriptor-creation
// overhead of Object.defineProperty, and keeps a stable hidden class.
const RenderInstructionProto: Record<symbol, boolean> = Object.create(null);
RenderInstructionProto[RenderInstructionSymbol] = true;

// Pre-allocated singleton instructions for the two hottest paths
// (maybeRenderHead and renderHead).  These are stateless — no per-call data —
// so one shared instance per type avoids all allocation.
const RENDER_HEAD_INSTRUCTION: RenderHeadInstruction = Object.assign(
	Object.create(RenderInstructionProto),
	{ type: 'head' as const },
);
const MAYBE_RENDER_HEAD_INSTRUCTION: MaybeRenderHeadInstruction = Object.assign(
	Object.create(RenderInstructionProto),
	{ type: 'maybe-head' as const },
);

export function createRenderInstruction(instruction: RenderHeadInstruction): RenderHeadInstruction;
export function createRenderInstruction(
	instruction: MaybeRenderHeadInstruction,
): MaybeRenderHeadInstruction;
export function createRenderInstruction<T extends RenderInstruction>(instruction: T): T;
export function createRenderInstruction<T extends RenderInstruction>(instruction: T): T {
	// Singleton fast paths for the two most frequently created instruction types.
	// These are called once per component render (maybeRenderHead) or once per
	// page (renderHead), and are completely stateless.
	if (instruction.type === 'head') return RENDER_HEAD_INSTRUCTION as unknown as T;
	if (instruction.type === 'maybe-head') return MAYBE_RENDER_HEAD_INSTRUCTION as unknown as T;

	// For stateful instructions (directive, script, etc.), create a new object
	// with the shared prototype and copy the instruction properties onto it.
	return Object.assign(Object.create(RenderInstructionProto), instruction);
}

export function isRenderInstruction(chunk: any): chunk is RenderInstruction {
	return chunk && typeof chunk === 'object' && chunk[RenderInstructionSymbol];
}

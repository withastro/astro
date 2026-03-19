export interface HeadInstructionRenderState {
	hasRenderedHead: boolean;
	headInTree: boolean;
	partial: boolean;
}

export function shouldRenderHeadInstruction(state: HeadInstructionRenderState): boolean {
	return !state.hasRenderedHead && !state.partial;
}

export function shouldRenderMaybeHeadInstruction(state: HeadInstructionRenderState): boolean {
	return !state.hasRenderedHead && !state.headInTree && !state.partial;
}

export function shouldRenderInstruction(
	type: 'head' | 'maybe-head',
	state: HeadInstructionRenderState,
): boolean {
	return type === 'head'
		? shouldRenderHeadInstruction(state)
		: shouldRenderMaybeHeadInstruction(state);
}

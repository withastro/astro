export interface HeadInstructionRenderState {
	hasRenderedHead: boolean;
	headInTree: boolean;
	partial: boolean;
}

/**
 * Policy for explicit `head` instructions.
 *
 * @example
 * A page with `<head>{Astro.head}</head>` renders once, then blocks repeats.
 */
export function shouldRenderHeadInstruction(state: HeadInstructionRenderState): boolean {
	return !state.hasRenderedHead && !state.partial;
}

/**
 * Policy for fallback `maybe-head` instructions.
 *
 * @example
 * A layout without `<head>` can inject styles with `maybe-head`, but only when
 * no explicit `<head>` exists in the rendered tree.
 */
export function shouldRenderMaybeHeadInstruction(state: HeadInstructionRenderState): boolean {
	return !state.hasRenderedHead && !state.headInTree && !state.partial;
}

/** Dispatches to the policy function for `head` or `maybe-head`. */
export function shouldRenderInstruction(
	type: 'head' | 'maybe-head',
	state: HeadInstructionRenderState,
): boolean {
	return type === 'head'
		? shouldRenderHeadInstruction(state)
		: shouldRenderMaybeHeadInstruction(state);
}

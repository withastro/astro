function shouldRenderHeadInstruction(state) {
	return !state.hasRenderedHead && !state.partial;
}
function shouldRenderMaybeHeadInstruction(state) {
	return !state.hasRenderedHead && !state.headInTree && !state.partial;
}
function shouldRenderInstruction(type, state) {
	return type === 'head'
		? shouldRenderHeadInstruction(state)
		: shouldRenderMaybeHeadInstruction(state);
}
export { shouldRenderHeadInstruction, shouldRenderInstruction, shouldRenderMaybeHeadInstruction };

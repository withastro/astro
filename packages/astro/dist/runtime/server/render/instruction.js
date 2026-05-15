const RenderInstructionSymbol = /* @__PURE__ */ Symbol.for('astro:render');
function createRenderInstruction(instruction) {
	return Object.defineProperty(instruction, RenderInstructionSymbol, {
		value: true,
	});
}
function isRenderInstruction(chunk) {
	return chunk && typeof chunk === 'object' && chunk[RenderInstructionSymbol];
}
export { createRenderInstruction, isRenderInstruction };

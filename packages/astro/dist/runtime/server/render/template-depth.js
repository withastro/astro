import { createRenderInstruction } from './instruction.js';
function templateEnter(_result) {
	return createRenderInstruction({ type: 'template-enter' });
}
function templateExit(_result) {
	return createRenderInstruction({ type: 'template-exit' });
}
export { templateEnter, templateExit };

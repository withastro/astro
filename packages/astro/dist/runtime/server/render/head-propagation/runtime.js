import { collectPropagatedHeadParts } from '../../../../core/head-propagation/buffer.js';
import {
	getPropagationHint as getHint,
	isPropagatingHint,
} from '../../../../core/head-propagation/resolver.js';
import { shouldRenderInstruction as shouldRenderInstructionByPolicy } from '../../../../core/head-propagation/policy.js';
import { isHeadAndContent } from '../astro/head-and-content.js';
function getPropagationHint(result, factory) {
	return getHint(result, factory);
}
function registerIfPropagating(result, factory, instance) {
	if (factory.propagation === 'self' || factory.propagation === 'in-tree') {
		result._metadata.propagators.add(instance);
		return;
	}
	if (factory.moduleId) {
		const hint = result.componentMetadata.get(factory.moduleId)?.propagation;
		if (isPropagatingHint(hint ?? 'none')) {
			result._metadata.propagators.add(instance);
		}
	}
}
async function bufferPropagatedHead(result) {
	const collected = await collectPropagatedHeadParts({
		propagators: result._metadata.propagators,
		result,
		isHeadAndContent,
	});
	result._metadata.extraHead.push(...collected);
}
function shouldRenderInstruction(type, state) {
	return shouldRenderInstructionByPolicy(type, state);
}
function getInstructionRenderState(result) {
	return {
		hasRenderedHead: result._metadata.hasRenderedHead,
		headInTree: result._metadata.headInTree,
		partial: result.partial,
	};
}
export {
	bufferPropagatedHead,
	getInstructionRenderState,
	getPropagationHint,
	registerIfPropagating,
	shouldRenderInstruction,
};

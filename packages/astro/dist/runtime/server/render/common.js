import { markHTMLString } from '../escape.js';
import {
	determineIfNeedsHydrationScript,
	determinesIfNeedsDirectiveScript,
	getPrescripts,
} from '../scripts.js';
import { getInstructionRenderState, shouldRenderInstruction } from './head-propagation/runtime.js';
import { renderAllHeadContent } from './head.js';
import { isRenderInstruction } from './instruction.js';
import { renderServerIslandRuntime } from './server-islands.js';
import { isSlotString } from './slot.js';
const Fragment = /* @__PURE__ */ Symbol.for('astro:fragment');
const Renderer = /* @__PURE__ */ Symbol.for('astro:renderer');
const encoder = new TextEncoder();
const decoder = new TextDecoder();
function stringifyChunk(result, chunk) {
	if (isRenderInstruction(chunk)) {
		const instruction = chunk;
		switch (instruction.type) {
			case 'directive': {
				const { hydration } = instruction;
				const needsHydrationScript = hydration && determineIfNeedsHydrationScript(result);
				const needsDirectiveScript =
					hydration && determinesIfNeedsDirectiveScript(result, hydration.directive);
				if (needsHydrationScript) {
					const prescripts = getPrescripts(result, 'both', hydration.directive);
					return markHTMLString(prescripts);
				} else if (needsDirectiveScript) {
					const prescripts = getPrescripts(result, 'directive', hydration.directive);
					return markHTMLString(prescripts);
				} else {
					return '';
				}
			}
			case 'head': {
				if (!shouldRenderInstruction('head', getInstructionRenderState(result))) {
					return '';
				}
				return renderAllHeadContent(result);
			}
			case 'maybe-head': {
				if (!shouldRenderInstruction('maybe-head', getInstructionRenderState(result))) {
					return '';
				}
				return renderAllHeadContent(result);
			}
			case 'renderer-hydration-script': {
				const { rendererSpecificHydrationScripts } = result._metadata;
				const { rendererName } = instruction;
				if (result._metadata.templateDepth > 0) {
					return instruction.render();
				}
				if (!rendererSpecificHydrationScripts.has(rendererName)) {
					rendererSpecificHydrationScripts.add(rendererName);
					return instruction.render();
				}
				return '';
			}
			case 'server-island-runtime': {
				if (result._metadata.templateDepth > 0) {
					return renderServerIslandRuntime();
				}
				if (result._metadata.hasRenderedServerIslandRuntime) {
					return '';
				}
				result._metadata.hasRenderedServerIslandRuntime = true;
				return renderServerIslandRuntime();
			}
			case 'script': {
				const { id, content } = instruction;
				if (result._metadata.templateDepth > 0) {
					return content;
				}
				if (result._metadata.renderedScripts.has(id)) {
					return '';
				}
				result._metadata.renderedScripts.add(id);
				return content;
			}
			case 'template-enter': {
				result._metadata.templateDepth++;
				return '';
			}
			case 'template-exit': {
				if (result._metadata.templateDepth <= 0) {
					throw new Error(
						'Unexpected template-exit instruction without a matching template-enter. This may indicate that the compiler emitted unbalanced template boundaries, or that a component manually injected a template-exit render instruction.',
					);
				}
				result._metadata.templateDepth--;
				return '';
			}
			default: {
				throw new Error(`Unknown chunk type: ${chunk.type}`);
			}
		}
	} else if (chunk instanceof Response) {
		return '';
	} else if (isSlotString(chunk)) {
		let out = '';
		const c = chunk;
		if (c.instructions) {
			for (const instr of c.instructions) {
				out += stringifyChunk(result, instr);
			}
		}
		out += chunk.toString();
		return out;
	}
	return chunk.toString();
}
function chunkToString(result, chunk) {
	if (ArrayBuffer.isView(chunk)) {
		return decoder.decode(chunk);
	} else {
		return stringifyChunk(result, chunk);
	}
}
function chunkToByteArray(result, chunk) {
	if (ArrayBuffer.isView(chunk)) {
		return chunk;
	} else {
		const stringified = stringifyChunk(result, chunk);
		return encoder.encode(stringified.toString());
	}
}
function chunkToByteArrayOrString(result, chunk) {
	if (ArrayBuffer.isView(chunk)) {
		return chunk;
	} else {
		return stringifyChunk(result, chunk).toString();
	}
}
function isRenderInstance(obj) {
	return !!obj && typeof obj === 'object' && 'render' in obj && typeof obj.render === 'function';
}
export {
	Fragment,
	Renderer,
	chunkToByteArray,
	chunkToByteArrayOrString,
	chunkToString,
	decoder,
	encoder,
	isRenderInstance,
};

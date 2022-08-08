import type { SSRResult } from '../../../@types/astro';
import type { RenderInstruction } from './types.js';

import { markHTMLString } from '../escape.js';
import {
	determineIfNeedsHydrationScript,
	determinesIfNeedsDirectiveScript,
	getPrescripts,
PrescriptType,
} from '../scripts.js';

export const Fragment = Symbol.for('astro:fragment');
export const Renderer = Symbol.for('astro:renderer');


// Rendering produces either marked strings of HTML or instructions for hydration.
// These directive instructions bubble all the way up to renderPage so that we
// can ensure they are added only once, and as soon as possible.
export function stringifyChunk(result: SSRResult, chunk: string | RenderInstruction) {
	switch ((chunk as any).type) {
		case 'directive': {
			const { hydration } = chunk as RenderInstruction;
			let needsHydrationScript = hydration && determineIfNeedsHydrationScript(result);
			let needsDirectiveScript =
				hydration && determinesIfNeedsDirectiveScript(result, hydration.directive);

			let prescriptType: PrescriptType = needsHydrationScript
				? 'both'
				: needsDirectiveScript
				? 'directive'
				: null;
			if (prescriptType) {
				let prescripts = getPrescripts(prescriptType, hydration.directive);
				return markHTMLString(prescripts);
			} else {
				return '';
			}
		}
		default: {
			return chunk.toString();
		}
	}
}

import type { SSRResult } from '../../../@types/astro.js';
import type { RenderInstruction } from './types.js';

import { markHTMLString } from '../escape.js';
import { renderSlot } from './slot.js';

export async function renderSuspense(
	result: SSRResult,
	id: string,
	slotted: any,
) {
	if (slotted) {
		const content = await renderSlot(result, slotted);
		return { type: 'suspense', id, content }
	}

	return '';
}

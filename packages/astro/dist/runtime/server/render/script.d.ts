import type { SSRResult } from '../../../types/public/internal.js';
/**
 * Relies on the `renderScript: true` compiler option
 * @experimental
 */
export declare function renderScript(
	result: SSRResult,
	id: string,
): Promise<{
	type: 'script';
	id: string;
	content: string;
}>;

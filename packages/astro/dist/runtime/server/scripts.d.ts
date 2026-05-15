import type { SSRResult } from '../../types/public/internal.js';
export declare function determineIfNeedsHydrationScript(result: SSRResult): boolean;
export declare function determinesIfNeedsDirectiveScript(
	result: SSRResult,
	directive: string,
): boolean;
export type PrescriptType = 'both' | 'directive';
export declare function getPrescripts(
	result: SSRResult,
	type: PrescriptType,
	directive: string,
): string;

import type { StylesheetAsset } from '../../../core/app/types.js';
import type { SSRElement, SSRResult } from '../../../types/public/internal.js';
export declare function renderScriptElement({ props, children }: SSRElement): string;
export declare function renderUniqueStylesheet(
	result: SSRResult,
	sheet: StylesheetAsset,
): string | undefined;

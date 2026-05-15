import type { SSRResult } from '../../../types/public/internal.js';
export declare function componentIsHTMLElement(Component: unknown): boolean;
export declare function renderHTMLElement(
	result: SSRResult,
	constructor: typeof HTMLElement,
	props: any,
	slots: any,
): Promise<string>;

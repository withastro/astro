import type { RouteData, SSRResult } from '../../../types/public/internal.js';
import { type RenderInstance } from './common.js';
import { type ComponentSlots } from './slot.js';
declare const needsHeadRenderingSymbol: unique symbol;
export declare function renderComponent(
	result: SSRResult,
	displayName: string,
	Component: unknown,
	props: Record<string | number, any>,
	slots?: ComponentSlots,
): RenderInstance | Promise<RenderInstance>;
export declare function renderComponentToString(
	result: SSRResult,
	displayName: string,
	Component: unknown,
	props: Record<string | number, any>,
	slots?: any,
	isPage?: boolean,
	route?: RouteData,
): Promise<string>;
export type NonAstroPageComponent = {
	name: string;
	[needsHeadRenderingSymbol]: boolean;
};
export {};

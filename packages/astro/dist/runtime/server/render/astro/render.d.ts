import type { RouteData, SSRResult } from '../../../../types/public/internal.js';
import type { AstroComponentFactory } from './factory.js';
/**
 * Queue-based rendering to AsyncIterable
 * NOTE: Currently disabled for .astro files. Kept for potential future use.
 */
export declare function renderToString(
	result: SSRResult,
	componentFactory: AstroComponentFactory,
	props: any,
	children: any,
	isPage?: boolean,
	route?: RouteData,
): Promise<string | Response>;
export declare function renderToReadableStream(
	result: SSRResult,
	componentFactory: AstroComponentFactory,
	props: any,
	children: any,
	isPage?: boolean,
	route?: RouteData,
): Promise<ReadableStream | Response>;
export declare function bufferHeadContent(result: SSRResult): Promise<void>;
export declare function renderToAsyncIterable(
	result: SSRResult,
	componentFactory: AstroComponentFactory,
	props: any,
	children: any,
	isPage?: boolean,
	route?: RouteData,
): Promise<AsyncIterable<Uint8Array> | Response>;

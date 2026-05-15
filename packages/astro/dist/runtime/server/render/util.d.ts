import type { SSRElement } from '../../../types/public/internal.js';
import type { RenderDestination, RenderFunction } from './common.js';
export declare const voidElementNames: RegExp;
export declare const toAttributeString: (value: any, shouldEscape?: boolean) => any;
export declare const toStyleString: (obj: Record<string, any>) => string;
export declare function defineScriptVars(vars: Record<any, any>): any;
export declare function formatList(values: string[]): string;
export declare function addAttribute(
	value: any,
	key: string,
	shouldEscape?: boolean,
	tagName?: string,
): any;
export declare function internalSpreadAttributes(
	values: Record<any, any>,
	shouldEscape: boolean | undefined,
	tagName: string,
): any;
export declare function renderElement(
	name: string,
	{ props: _props, children }: SSRElement,
	shouldEscape?: boolean,
): string;
/**
 * Executes the `bufferRenderFunction` to prerender it into a buffer destination, and return a promise
 * with an object containing the `flush` function to flush the buffer to the final
 * destination.
 *
 * @example
 * ```ts
 * // Render components in parallel ahead of time
 * const finalRenders = [ComponentA, ComponentB].map((comp) => {
 *   return createBufferedRenderer(finalDestination, async (bufferDestination) => {
 *     await renderComponentToDestination(bufferDestination);
 *   });
 * });
 * // Render array of components serially
 * for (const finalRender of finalRenders) {
 *   await finalRender.flush();
 * }
 * ```
 */
export declare function createBufferedRenderer(
	destination: RenderDestination,
	renderFunction: RenderFunction,
): RendererFlusher;
export interface RendererFlusher {
	/**
	 * Flushes the current renderer to the underlying renderer.
	 *
	 * See example of `createBufferedRenderer` for usage.
	 */
	flush(): void | Promise<void>;
}
export declare const isNode: boolean;
export declare const isDeno: boolean;
export type PromiseWithResolvers<T> = {
	promise: Promise<T>;
	resolve: (value: T) => void;
	reject: (reason?: any) => void;
};
export declare function promiseWithResolvers<T = any>(): PromiseWithResolvers<T>;

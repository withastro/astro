import type { RenderDestination } from '../common.js';
declare const renderTemplateResultSym: unique symbol;
export declare class RenderTemplateResult {
	[renderTemplateResultSym]: boolean;
	private htmlParts;
	expressions: any[];
	private error;
	constructor(htmlParts: TemplateStringsArray, expressions: unknown[]);
	render(destination: RenderDestination): void | Promise<void>;
}
export declare function isRenderTemplateResult(obj: unknown): obj is RenderTemplateResult;
export declare function renderTemplate(
	htmlParts: TemplateStringsArray,
	...expressions: any[]
): RenderTemplateResult;
export {};

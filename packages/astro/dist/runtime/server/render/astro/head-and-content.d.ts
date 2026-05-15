import type { RenderTemplateResult } from './render-template.js';
declare const headAndContentSym: unique symbol;
export type HeadAndContent = {
	[headAndContentSym]: true;
	head: string;
	content: RenderTemplateResult;
};
/**
 * A head that doesn't contain any content
 */
export type ThinHead = {
	[headAndContentSym]: true;
};
export declare function isHeadAndContent(obj: unknown): obj is HeadAndContent;
export declare function createHeadAndContent(
	head: string,
	content: RenderTemplateResult,
): HeadAndContent;
export declare function createThinHead(): ThinHead;
export {};

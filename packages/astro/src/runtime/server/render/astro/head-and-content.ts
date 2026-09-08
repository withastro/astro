import type { RenderTemplateResult } from './render-template.js';

const headAndContentSym = Symbol.for('astro.headAndContent');

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

export function isHeadAndContent(obj: unknown): obj is HeadAndContent {
	return typeof obj === 'object' && obj !== null && !!(obj as any)[headAndContentSym];
}

export function createHeadAndContent(head: string, content: RenderTemplateResult): HeadAndContent {
	return {
		[headAndContentSym]: true,
		head,
		content,
	};
}

export function createThinHead(): ThinHead {
	return {
		[headAndContentSym]: true,
	};
}

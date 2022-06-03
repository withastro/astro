import { mdxjs } from 'micromark-extension-mdxjs';
import { mdxFromMarkdown, mdxToMarkdown } from './mdast-util-mdxish.js';
import type * as fromMarkdown from 'mdast-util-from-markdown';
import type { Tag } from 'mdast-util-mdx-jsx';

export default function remarkMdxish(this: any, options = {}) {
	const data = this.data();

	add('micromarkExtensions', mdxjs(options));
	add('fromMarkdownExtensions', makeFromMarkdownLessStrict(mdxFromMarkdown()));
	add('toMarkdownExtensions', mdxToMarkdown());

	function add(field: string, value: unknown) {
		const list = data[field] ? data[field] : (data[field] = []);
		list.push(value);
	}
}

function makeFromMarkdownLessStrict(extensions: fromMarkdown.Extension[]) {
	extensions.forEach((extension) => {
		// Fix exit handlers that are too strict
		['mdxJsxFlowTag', 'mdxJsxTextTag'].forEach((exitHandler) => {
			if (!extension.exit || !extension.exit[exitHandler]) return;
			extension.exit[exitHandler] = chainHandlers(fixSelfClosing, extension.exit[exitHandler]);
		});
	});

	return extensions;
}

const selfClosingTags = new Set([
	'area',
	'base',
	'br',
	'col',
	'embed',
	'hr',
	'img',
	'input',
	'link',
	'meta',
	'source',
	'track',
	'wbr',
]);

function fixSelfClosing(this: fromMarkdown.CompileContext) {
	const tag = this.getData('mdxJsxTag') as Tag;
	if (tag.name && selfClosingTags.has(tag.name)) tag.selfClosing = true;
}

function chainHandlers(...handlers: fromMarkdown.Handle[]) {
	return function handlerChain(this: fromMarkdown.CompileContext, token: fromMarkdown.Token) {
		handlers.forEach((handler) => handler.call(this, token));
	};
}

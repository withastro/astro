import type * as fromMarkdown from 'mdast-util-from-markdown';
import type { Tag } from 'mdast-util-mdx-jsx';
import { mdxFromMarkdown, mdxToMarkdown } from './mdast-util-mdxish.js';
import { mdxjs } from './mdxjs.js';

// Prepare markdown extensions once to prevent performance issues
const extMdxJs = mdxjs({});
const extMdxFromMarkdown = makeFromMarkdownLessStrict(mdxFromMarkdown());
const extMdxToMarkdown = mdxToMarkdown();

export default function remarkMdxish(this: any) {
	const data = this.data();

	add('micromarkExtensions', extMdxJs);
	add('fromMarkdownExtensions', extMdxFromMarkdown);
	add('toMarkdownExtensions', extMdxToMarkdown);

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

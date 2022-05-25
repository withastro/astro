import { mdxjs } from 'micromark-extension-mdxjs';
import { mdxFromMarkdown, mdxToMarkdown } from './mdast-util-mdxish.js';

export default function remarkMdxish(this: any, options = {}) {
	const data = this.data();

	add('micromarkExtensions', mdxjs(options));
	add('fromMarkdownExtensions', mdxFromMarkdown());
	add('toMarkdownExtensions', mdxToMarkdown());

	function add(field: string, value: unknown) {
		const list = data[field] ? data[field] : (data[field] = []);
		list.push(value);
	}
}

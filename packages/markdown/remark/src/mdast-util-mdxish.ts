import { mdxExpressionFromMarkdown, mdxExpressionToMarkdown } from 'mdast-util-mdx-expression';
import { mdxJsxFromMarkdown, mdxJsxToMarkdown } from 'mdast-util-mdx-jsx';

export function mdxFromMarkdown(): any {
	return [mdxExpressionFromMarkdown, mdxJsxFromMarkdown];
}

export function mdxToMarkdown(): any {
	return {
		extensions: [mdxExpressionToMarkdown, mdxJsxToMarkdown],
	};
}

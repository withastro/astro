// Vite bug: dynamically import() modules needed for CJS. Cache in memory to keep side effects
let mdxExpression: any;
let mdxExpressionFromMarkdown: any;
let mdxExpressionToMarkdown: any;

export function remarkExpressions(this: any, options: any) {
	let settings = options || {};
	let data = this.data();

	add('micromarkExtensions', mdxExpression({}));
	add('fromMarkdownExtensions', mdxExpressionFromMarkdown);
	add('toMarkdownExtensions', mdxExpressionToMarkdown);

	function add(field: any, value: any) {
		/* istanbul ignore if - other extensions. */
		if (data[field]) data[field].push(value);
		else data[field] = [value];
	}
}

export async function loadRemarkExpressions() {
	if (!mdxExpression) {
		const micromarkMdxExpression = await import('micromark-extension-mdx-expression');
		mdxExpression = micromarkMdxExpression.mdxExpression;
	}
	if (!mdxExpressionFromMarkdown || !mdxExpressionToMarkdown) {
		const mdastUtilMdxExpression = await import('mdast-util-mdx-expression');
		mdxExpressionFromMarkdown = mdastUtilMdxExpression.mdxExpressionFromMarkdown;
		mdxExpressionToMarkdown = mdastUtilMdxExpression.mdxExpressionToMarkdown;
	}
}

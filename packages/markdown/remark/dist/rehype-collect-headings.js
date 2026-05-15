import Slugger from 'github-slugger';
import { visit } from 'unist-util-visit';
import { FORBIDDEN_PATH_KEYS } from '@astrojs/internal-helpers/object';
const rawNodeTypes = /* @__PURE__ */ new Set(['text', 'raw', 'mdxTextExpression']);
const codeTagNames = /* @__PURE__ */ new Set(['code', 'pre']);
function rehypeHeadingIds() {
	return function (tree, file) {
		const headings = [];
		const frontmatter = file.data.astro?.frontmatter;
		const slugger = new Slugger();
		const isMDX = isMDXFile(file);
		visit(tree, (node) => {
			if (node.type !== 'element') return;
			const { tagName } = node;
			if (tagName[0] !== 'h') return;
			const [, level] = /h([0-6])/.exec(tagName) ?? [];
			if (!level) return;
			const depth = Number.parseInt(level);
			let text = '';
			visit(node, (child, __, parent) => {
				if (child.type === 'element' || parent == null) {
					return;
				}
				if (child.type === 'raw') {
					if (/^\n?<.*>\n?$/.test(child.value)) {
						return;
					}
				}
				if (rawNodeTypes.has(child.type)) {
					if (isMDX || codeTagNames.has(parent.tagName)) {
						let value = child.value;
						if (isMdxTextExpression(child) && frontmatter) {
							const frontmatterPath = getMdxFrontmatterVariablePath(child);
							if (Array.isArray(frontmatterPath) && frontmatterPath.length > 0) {
								const frontmatterValue = getMdxFrontmatterVariableValue(
									frontmatter,
									frontmatterPath,
								);
								if (typeof frontmatterValue === 'string') {
									value = frontmatterValue;
								}
							}
						}
						text += value;
					} else {
						text += child.value.replace(/\{/g, '${');
					}
				}
			});
			node.properties = node.properties || {};
			if (typeof node.properties.id !== 'string') {
				node.properties.id = slugger.slug(text);
			}
			headings.push({ depth, slug: node.properties.id, text });
		});
		file.data.astro ??= {};
		file.data.astro.headings = headings;
	};
}
function isMDXFile(file) {
	return Boolean(file.history[0]?.endsWith('.mdx'));
}
function getMdxFrontmatterVariablePath(node) {
	if (!node.data?.estree || node.data.estree.body.length !== 1) return new Error();
	const statement = node.data.estree.body[0];
	if (statement?.type !== 'ExpressionStatement' || statement.expression.type !== 'MemberExpression')
		return new Error();
	let expression = statement.expression;
	const expressionPath = [];
	while (
		expression.type === 'MemberExpression' &&
		expression.property.type === (expression.computed ? 'Literal' : 'Identifier')
	) {
		expressionPath.push(
			expression.property.type === 'Literal'
				? String(expression.property.value)
				: expression.property.name,
		);
		expression = expression.object;
	}
	if (expression.type !== 'Identifier' || expression.name !== 'frontmatter') return new Error();
	return expressionPath.reverse();
}
function getMdxFrontmatterVariableValue(frontmatter, path) {
	let value = frontmatter;
	for (const key of path) {
		if (
			FORBIDDEN_PATH_KEYS.has(key) ||
			!value ||
			typeof value !== 'object' ||
			!Object.hasOwn(value, key)
		) {
			return void 0;
		}
		value = value[key];
	}
	return value;
}
function isMdxTextExpression(node) {
	return node.type === 'mdxTextExpression';
}
export { rehypeHeadingIds };

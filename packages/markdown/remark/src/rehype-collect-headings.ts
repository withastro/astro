import type { Expression, Super } from 'estree';
import Slugger from 'github-slugger';
import type { MdxTextExpression } from 'mdast-util-mdx-expression';
import type { Node } from 'unist';
import { visit } from 'unist-util-visit';
import { InvalidAstroDataError, safelyGetAstroData } from './frontmatter-injection.js';
import type { MarkdownAstroData, MarkdownHeading, MarkdownVFile, RehypePlugin } from './types.js';
import type { Element } from 'hast';
import type {
	MdxJsxAttribute,
	MdxJsxFlowElementHast,
	MdxJsxTextElementHast,
} from 'mdast-util-mdx-jsx';

const rawNodeTypes = new Set(['text', 'raw', 'mdxTextExpression']);
const codeTagNames = new Set(['code', 'pre']);

export function rehypeHeadingIds(): ReturnType<RehypePlugin> {
	return function (tree, file: MarkdownVFile) {
		const headings: MarkdownHeading[] = [];
		const slugger = new Slugger();
		const isMDX = isMDXFile(file);
		const astroData = safelyGetAstroData(file.data);
		visit(tree, (node) => {
			if (!(node.type === 'element' || node.type === 'mdxJsxFlowElement')) return;
			const tagName = extractTagNameFromNode(node);
			if (tagName === null || tagName[0] !== 'h') return;
			const [_, level] = tagName.match(/h([0-6])/) ?? [];
			if (!level) return;
			const depth = Number.parseInt(level);

			let text = '';
			visit(node, (child, __, parent) => {
				if (child.type === 'element' || parent == null) {
					return;
				}
				if (child.type === 'raw') {
					if (child.value.match(/^\n?<.*>\n?$/)) {
						return;
					}
				}
				if (rawNodeTypes.has(child.type)) {
					const parentTagName = extractTagNameFromNode(parent);
					if (parentTagName) {
						if (isMDX || codeTagNames.has(parentTagName)) {
							let value;
							if (child.type == 'raw') {
								value = child.value;
							} else if (child.type == 'text') {
								value = child.value;
							} else if (child.type == 'mdxTextExpression') {
								value = child.value;
							}
							if (isMdxTextExpression(child) && !(astroData instanceof InvalidAstroDataError)) {
								const frontmatterPath = getMdxFrontmatterVariablePath(child);
								if (Array.isArray(frontmatterPath) && frontmatterPath.length > 0) {
									const frontmatterValue = getMdxFrontmatterVariableValue(
										astroData,
										frontmatterPath
									);
									if (typeof frontmatterValue === 'string') {
										value = frontmatterValue;
									}
								}
							}
							text += value;
						} else {
							if (typeof (child as any).value !== 'undefined') {
								text += (child as any).value.replace(/\{/g, '${');
							}
						}
					}
				}
			});

			if (nodeIsElement(node)) {
				node.properties = node.properties || {};
				if (typeof node.properties.id !== 'string') {
					let slug = slugger.slug(text);

					if (slug.endsWith('-')) slug = slug.slice(0, -1);

					node.properties.id = slug;
				}

				headings.push({ depth, slug: node.properties.id, text });
			} else if (nodeIsJsxFlowElement(node)) {
				node.attributes = node.attributes || {};
				let slug = slugger.slug(text);

				if (slug.endsWith('-')) slug = slug.slice(0, -1);

				const attribute: MdxJsxAttribute = {
					type: 'mdxJsxAttribute',
					value: slug,
					name: 'id',
				};
				node.attributes.push(attribute);

				headings.push({ depth, slug, text });
			}
		});

		file.data.__astroHeadings = headings;
	};
}

function isMDXFile(file: MarkdownVFile) {
	return Boolean(file.history[0]?.endsWith('.mdx'));
}

/**
 * Check if an ESTree entry is `frontmatter.*.VARIABLE`.
 * If it is, return the variable path (i.e. `["*", ..., "VARIABLE"]`) minus the `frontmatter` prefix.
 */
function getMdxFrontmatterVariablePath(node: MdxTextExpression): string[] | Error {
	if (!node.data?.estree || node.data.estree.body.length !== 1) return new Error();

	const statement = node.data.estree.body[0];

	// Check for "[ANYTHING].[ANYTHING]".
	if (statement?.type !== 'ExpressionStatement' || statement.expression.type !== 'MemberExpression')
		return new Error();

	let expression: Expression | Super = statement.expression;
	const expressionPath: string[] = [];

	// Traverse the expression, collecting the variable path.
	while (
		expression.type === 'MemberExpression' &&
		expression.property.type === (expression.computed ? 'Literal' : 'Identifier')
	) {
		expressionPath.push(
			expression.property.type === 'Literal'
				? String(expression.property.value)
				: expression.property.name
		);

		expression = expression.object;
	}

	// Check for "frontmatter.[ANYTHING]".
	if (expression.type !== 'Identifier' || expression.name !== 'frontmatter') return new Error();

	return expressionPath.reverse();
}

function getMdxFrontmatterVariableValue(astroData: MarkdownAstroData, path: string[]) {
	let value: MdxFrontmatterVariableValue = astroData.frontmatter;

	for (const key of path) {
		if (!value[key]) return undefined;

		value = value[key];
	}

	return value;
}

function isMdxTextExpression(node: Node): node is MdxTextExpression {
	return node.type === 'mdxTextExpression';
}

type MdxFrontmatterVariableValue =
	MarkdownAstroData['frontmatter'][keyof MarkdownAstroData['frontmatter']];

function nodeIsJsxFlowElement(node: any): node is MdxJsxFlowElementHast {
	if (node.type === 'mdxJsxFlowElement') {
		return true;
	} else {
		return false;
	}
}

function nodeIsElement(node: any): node is Element {
	if (node.type === 'element') {
		return true;
	} else {
		return false;
	}
}

function extractTagNameFromNode(
	node: Element | MdxJsxFlowElementHast | MdxJsxTextElementHast
): string | null {
	if (nodeIsJsxFlowElement(node)) {
		return node.name;
	} else if (nodeIsElement(node)) {
		return node.tagName;
	} else {
		return null;
	}
}

function extractRawValue(node: unknown) {}

import type { ParentNode, ParseResult } from '@astrojs/compiler/types';
import { is } from '@astrojs/compiler/utils';
import type { CodeInformation, VirtualCode } from '@volar/language-core';
import { Segment, toString } from 'muggle-string';
import type ts from 'typescript';
import type { HTMLDocument, Node } from 'vscode-html-languageservice';
import { buildMappings } from '../buildMappings.js';
import type { AttributeNodeWithPosition } from './compilerUtils.js';

export function extractStylesheets(
	snapshot: ts.IScriptSnapshot,
	htmlDocument: HTMLDocument,
	ast: ParseResult['ast']
): VirtualCode[] {
	const embeddedCSSCodes: VirtualCode[] = findEmbeddedStyles(snapshot, htmlDocument.roots);

	const inlineStyles = findInlineStyles(ast);
	if (inlineStyles.length > 0) {
		const codes: Segment<CodeInformation>[] = [];
		for (const inlineStyle of inlineStyles) {
			codes.push('x { ');
			codes.push([
				inlineStyle.value,
				undefined,
				inlineStyle.position.start.offset + 'style="'.length,
				{
					completion: true,
					verification: false,
					semantic: true,
					navigation: true,
					structure: true,
					format: false,
				},
			]);
			codes.push(' }\n');
		}

		const mappings = buildMappings(codes);
		const text = toString(codes);

		embeddedCSSCodes.push({
			id: 'inline.css',
			languageId: 'css',
			snapshot: {
				getText: (start, end) => text.substring(start, end),
				getLength: () => text.length,
				getChangeRange: () => undefined,
			},
			embeddedCodes: [],
			mappings,
		});
	}

	return embeddedCSSCodes;
}

/**
 * Find all embedded styles in a document.
 * Embedded styles are styles that are defined in `<style>` tags.
 */
function findEmbeddedStyles(snapshot: ts.IScriptSnapshot, roots: Node[]): VirtualCode[] {
	const embeddedCSSCodes: VirtualCode[] = [];
	let cssIndex = 0;

	getEmbeddedCSSInNodes(roots);

	function getEmbeddedCSSInNodes(nodes: Node[]) {
		for (const [_, node] of nodes.entries()) {
			if (
				node.tag === 'style' &&
				node.startTagEnd !== undefined &&
				node.endTagStart !== undefined
			) {
				const styleText = snapshot.getText(node.startTagEnd, node.endTagStart);
				embeddedCSSCodes.push({
					id: `${cssIndex}.css`,
					languageId: 'css',
					snapshot: {
						getText: (start, end) => styleText.substring(start, end),
						getLength: () => styleText.length,
						getChangeRange: () => undefined,
					},
					mappings: [
						{
							sourceOffsets: [node.startTagEnd],
							generatedOffsets: [0],
							lengths: [styleText.length],
							data: {
								verification: false,
								completion: true,
								semantic: true,
								navigation: true,
								structure: true,
								format: false,
							},
						},
					],
					embeddedCodes: [],
				});
				cssIndex++;
			}

			if (node.children) getEmbeddedCSSInNodes(node.children);
		}
	}

	return embeddedCSSCodes;
}

/**
 * Find all inline styles using the Astro AST
 * Inline styles are styles that are defined in the `style` attribute of an element.
 * TODO: Merge this with `findEmbeddedCSS`? Unlike scripts, there's no scoping being done here, so merging all of it in
 * the same virtual file is possible, though it might make mapping more tricky.
 */
function findInlineStyles(ast: ParseResult['ast']): AttributeNodeWithPosition[] {
	const styleAttrs: AttributeNodeWithPosition[] = [];

	// `@astrojs/compiler`'s `walk` method is async, so we can't use it here. Arf
	function walkDown(parent: ParentNode) {
		if (!parent.children) return;

		parent.children.forEach((child) => {
			if (is.element(child)) {
				const styleAttribute = child.attributes.find(
					(attr) => attr.name === 'style' && attr.kind === 'quoted'
				);

				if (styleAttribute && styleAttribute.position) {
					styleAttrs.push(styleAttribute as AttributeNodeWithPosition);
				}
			}

			if (is.parent(child)) {
				walkDown(child);
			}
		});
	}

	walkDown(ast);

	return styleAttrs;
}

// TODO: Provide completion for classes and IDs
export function collectClassesAndIdsFromDocument(ast: ParseResult['ast']): string[] {
	const classesAndIds: string[] = [];
	function walkDown(parent: ParentNode) {
		if (!parent.children) return;

		parent.children.forEach((child) => {
			if (is.element(child)) {
				const classOrIDAttributes = child.attributes
					.filter((attr) => attr.kind === 'quoted' && (attr.name === 'class' || attr.name === 'id'))
					.flatMap((attr) => attr.value.split(' '));

				classesAndIds.push(...classOrIDAttributes);
			}

			if (is.parent(child)) {
				walkDown(child);
			}
		});
	}

	walkDown(ast);

	return classesAndIds;
}

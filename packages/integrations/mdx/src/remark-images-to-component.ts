import type { MarkdownVFile } from '@astrojs/markdown-remark';
import { type Image, type Parent } from 'mdast';
import type { MdxjsEsm, MdxJsxFlowElement } from 'mdast-util-mdx';
import { visit } from 'unist-util-visit';
import { jsToTreeNode } from './utils.js';

export function remarkImageToComponent() {
	return function (tree: any, file: MarkdownVFile) {
		if (!file.data.imagePaths) return;

		const importsStatements: MdxjsEsm[] = [];
		const importedImages = new Map<string, string>();

		visit(tree, 'image', (node: Image, index: number | null, parent: Parent | null) => {
			// Use the imagePaths set from the remark-collect-images so we don't have to duplicate the logic for
			// checking if an image should be imported or not
			if (file.data.imagePaths?.has(node.url)) {
				let importName = importedImages.get(node.url);

				// If we haven't already imported this image, add an import statement
				if (!importName) {
					importName = `__${importedImages.size}_${node.url.replace(/\W/g, '_')}__`;

					importsStatements.push({
						type: 'mdxjsEsm',
						value: '',
						data: {
							estree: {
								type: 'Program',
								sourceType: 'module',
								body: [
									{
										type: 'ImportDeclaration',
										source: { type: 'Literal', value: node.url, raw: JSON.stringify(node.url) },
										specifiers: [
											{
												type: 'ImportDefaultSpecifier',
												local: { type: 'Identifier', name: importName },
											},
										],
									},
								],
							},
						},
					});
					importedImages.set(node.url, importName);
				}

				// Build a component that's equivalent to <Image src={importName} alt={node.alt} title={node.title} />
				const componentElement: MdxJsxFlowElement = {
					name: '__AstroImage__',
					type: 'mdxJsxFlowElement',
					attributes: [
						{
							name: 'src',
							type: 'mdxJsxAttribute',
							value: {
								type: 'mdxJsxAttributeValueExpression',
								value: importName,
								data: {
									estree: {
										type: 'Program',
										sourceType: 'module',
										comments: [],
										body: [
											{
												type: 'ExpressionStatement',
												expression: { type: 'Identifier', name: importName },
											},
										],
									},
								},
							},
						},
						{ name: 'alt', type: 'mdxJsxAttribute', value: node.alt || '' },
					],
					children: [],
				};

				if (node.title) {
					componentElement.attributes.push({
						type: 'mdxJsxAttribute',
						name: 'title',
						value: node.title,
					});
				}

				parent!.children.splice(index!, 1, componentElement);
			}
		});

		// Add all the import statements to the top of the file for the images
		tree.children.unshift(...importsStatements);

		// Add an import statement for the Astro Image component, we rename it to avoid conflicts
		tree.children.unshift(jsToTreeNode(`import { Image as __AstroImage__ } from "astro:assets";`));
	};
}

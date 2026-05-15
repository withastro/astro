import { visit } from 'unist-util-visit';
import { jsToTreeNode } from './utils.js';
const ASTRO_IMAGE_ELEMENT = 'astro-image';
const ASTRO_IMAGE_IMPORT = '__AstroImage__';
const USES_ASTRO_IMAGE_FLAG = '__usesAstroImage';
function createArrayAttribute(name, values) {
	return {
		type: 'mdxJsxAttribute',
		name,
		value: {
			type: 'mdxJsxAttributeValueExpression',
			value: name,
			data: {
				estree: {
					type: 'Program',
					body: [
						{
							type: 'ExpressionStatement',
							expression: {
								type: 'ArrayExpression',
								elements: values.map((value) => ({
									type: 'Literal',
									value,
									raw: String(value),
								})),
							},
						},
					],
					sourceType: 'module',
					comments: [],
				},
			},
		},
	};
}
function getImageComponentAttributes(props) {
	const attrs = [];
	for (const [prop, value] of Object.entries(props)) {
		if (prop === 'src') continue;
		if (prop === 'widths' || prop === 'densities') {
			attrs.push(createArrayAttribute(prop, String(value).split(' ')));
		} else {
			attrs.push({
				name: prop,
				type: 'mdxJsxAttribute',
				value: String(value),
			});
		}
	}
	return attrs;
}
function rehypeImageToComponent() {
	return function (tree, file) {
		if (!file.data.astro?.localImagePaths?.length && !file.data.astro?.remoteImagePaths?.length)
			return;
		const importsStatements = [];
		const importedImages = /* @__PURE__ */ new Map();
		visit(tree, 'element', (node, index, parent) => {
			if (node.tagName !== 'img' || !node.properties.src) return;
			const src = decodeURI(String(node.properties.src));
			const isLocalImage = file.data.astro?.localImagePaths?.includes(src);
			const isRemoteImage = file.data.astro?.remoteImagePaths?.includes(src);
			let element;
			if (isLocalImage) {
				let importName = importedImages.get(src);
				if (!importName) {
					importName = `__${importedImages.size}_${src.replace(/\W/g, '_')}__`;
					importsStatements.push({
						type: 'mdxjsEsm',
						value: '',
						data: {
							estree: {
								type: 'Program',
								sourceType: 'module',
								body: [
									{
										attributes: [],
										type: 'ImportDeclaration',
										source: {
											type: 'Literal',
											value: src,
											raw: JSON.stringify(src),
										},
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
					importedImages.set(src, importName);
				}
				element = {
					name: ASTRO_IMAGE_ELEMENT,
					type: 'mdxJsxFlowElement',
					attributes: [
						...getImageComponentAttributes(node.properties),
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
					],
					children: [],
				};
			} else if (isRemoteImage) {
				element = {
					name: ASTRO_IMAGE_ELEMENT,
					type: 'mdxJsxFlowElement',
					attributes: [
						...getImageComponentAttributes(node.properties),
						{
							name: 'src',
							type: 'mdxJsxAttribute',
							value: src,
						},
					],
					children: [],
				};
			} else {
				return;
			}
			parent.children.splice(index, 1, element);
		});
		tree.children.unshift(...importsStatements);
		tree.children.unshift(
			jsToTreeNode(`import { Image as ${ASTRO_IMAGE_IMPORT} } from "astro:assets";`),
		);
		tree.children.push(jsToTreeNode(`export const ${USES_ASTRO_IMAGE_FLAG} = true`));
	};
}
export { ASTRO_IMAGE_ELEMENT, ASTRO_IMAGE_IMPORT, USES_ASTRO_IMAGE_FLAG, rehypeImageToComponent };

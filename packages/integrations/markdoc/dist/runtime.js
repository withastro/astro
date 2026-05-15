import Markdoc from '@markdoc/markdoc';
import { createComponent, renderComponent } from 'astro/runtime/server/index.js';
import { setupHeadingConfig } from './heading-ids.js';
import { htmlTag } from './html/tagdefs/html.tag.js';
async function setupConfig(userConfig = {}, options) {
	let defaultConfig = setupHeadingConfig();
	if (userConfig.extends) {
		for (let extension of userConfig.extends) {
			if (extension instanceof Promise) {
				extension = await extension;
			}
			defaultConfig = mergeConfig(defaultConfig, extension);
		}
	}
	let merged = mergeConfig(defaultConfig, userConfig);
	if (options?.allowHTML) {
		merged = mergeConfig(merged, HTML_CONFIG);
	}
	syncTagNodeAttributes(merged);
	return merged;
}
function setupConfigSync(userConfig = {}, options) {
	const defaultConfig = setupHeadingConfig();
	let merged = mergeConfig(defaultConfig, userConfig);
	if (options?.allowHTML) {
		merged = mergeConfig(merged, HTML_CONFIG);
	}
	syncTagNodeAttributes(merged);
	return merged;
}
function mergeConfig(configA, configB) {
	return {
		...configA,
		...configB,
		ctx: {
			...configA.ctx,
			...configB.ctx,
		},
		tags: {
			...configA.tags,
			...configB.tags,
		},
		nodes: {
			...configA.nodes,
			...configB.nodes,
		},
		functions: {
			...configA.functions,
			...configB.functions,
		},
		variables: {
			...configA.variables,
			...configB.variables,
		},
		partials: {
			...configA.partials,
			...configB.partials,
		},
		validation: {
			...configA.validation,
			...configB.validation,
		},
	};
}
function syncTagNodeAttributes(config) {
	const builtinTags = Markdoc.tags;
	const builtinNodes = Markdoc.nodes;
	for (const name of Object.keys(builtinTags)) {
		if (!(name in builtinNodes)) continue;
		const tagSchema = config.tags[name];
		const nodeSchema = config.nodes[name];
		const tagAttrs = tagSchema?.attributes;
		const nodeAttrs = nodeSchema?.attributes;
		if (!tagAttrs && !nodeAttrs) continue;
		const mergedAttrs = { ...tagAttrs, ...nodeAttrs };
		if (tagSchema) {
			config.tags[name] = { ...tagSchema, attributes: mergedAttrs };
		} else {
			config.tags[name] = { ...builtinTags[name], attributes: mergedAttrs };
		}
		if (nodeSchema) {
			config.nodes[name] = { ...nodeSchema, attributes: mergedAttrs };
		} else {
			config.nodes[name] = { ...builtinNodes[name], attributes: mergedAttrs };
		}
	}
}
function transformRespectsRender(transform, configKey) {
	const source = transform.toString();
	return (
		source.includes(`config.nodes?.${configKey}?.render`) ||
		source.includes(`config.tags?.${configKey}?.render`)
	);
}
function resolveComponentImports(markdocConfig, tagComponentMap, nodeComponentMap) {
	for (const [tag, render] of Object.entries(tagComponentMap)) {
		const config = markdocConfig.tags[tag];
		if (config) {
			config.render = render;
			if (config.transform && !transformRespectsRender(config.transform, tag)) {
				delete config.transform;
			}
		}
	}
	for (const [node, render] of Object.entries(nodeComponentMap)) {
		const config = markdocConfig.nodes[node];
		if (config) {
			config.render = render;
			if (config.transform && !transformRespectsRender(config.transform, node)) {
				delete config.transform;
			}
		}
	}
	return markdocConfig;
}
function getTextContent(childNodes) {
	let text = '';
	for (const node of childNodes) {
		if (typeof node === 'string' || typeof node === 'number') {
			text += node;
		} else if (typeof node === 'object' && Markdoc.Tag.isTag(node)) {
			text += getTextContent(node.children);
		}
	}
	return text;
}
const headingLevels = [1, 2, 3, 4, 5, 6];
function collectHeadings(children, collectedHeadings) {
	for (const node of children) {
		if (typeof node !== 'object' || !Markdoc.Tag.isTag(node)) continue;
		if (node.attributes.__collectHeading === true && typeof node.attributes.level === 'number') {
			collectedHeadings.push({
				slug: node.attributes.id,
				depth: node.attributes.level,
				text: getTextContent(node.children),
			});
			continue;
		}
		for (const level of headingLevels) {
			if (node.name === 'h' + level) {
				collectedHeadings.push({
					slug: node.attributes.id,
					depth: level,
					text: getTextContent(node.children),
				});
			}
		}
		collectHeadings(node.children, collectedHeadings);
	}
}
function createGetHeadings(stringifiedAst, userConfig, options) {
	return function getHeadings() {
		const config = setupConfigSync(userConfig, options);
		const ast = Markdoc.Ast.fromJSON(stringifiedAst);
		const content = Markdoc.transform(ast, config);
		let collectedHeadings = [];
		collectHeadings(Array.isArray(content) ? content : [content], collectedHeadings);
		return collectedHeadings;
	};
}
function createContentComponent(
	Renderer,
	stringifiedAst,
	userConfig,
	options,
	tagComponentMap,
	nodeComponentMap,
) {
	return createComponent({
		async factory(result, props) {
			const withVariables = mergeConfig(userConfig, { variables: props });
			const config = resolveComponentImports(
				await setupConfig(withVariables, options),
				tagComponentMap,
				nodeComponentMap,
			);
			return renderComponent(result, Renderer.name, Renderer, { stringifiedAst, config }, {});
		},
		propagation: 'self',
	});
}
const HTML_CONFIG = {
	tags: {
		'html-tag': htmlTag,
	},
};
export {
	collectHeadings,
	createContentComponent,
	createGetHeadings,
	getTextContent,
	mergeConfig,
	resolveComponentImports,
	setupConfig,
	setupConfigSync,
};

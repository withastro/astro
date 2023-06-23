/* eslint-disable no-console */
import type { Config as MarkdocConfig, Node } from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';
import type { AstroConfig, ContentEntryType } from 'astro';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isValidUrl, MarkdocError, parseFrontmatter, prependForwardSlash } from './utils.js';
// @ts-expect-error Cannot find module 'astro/assets' or its corresponding type declarations.
import { emitESMImage } from 'astro/assets';
import path from 'node:path';
import type * as rollup from 'rollup';
import { setupConfig } from './runtime.js';
import { isComponentConfig, type ComponentConfig } from './config.js';
import type { MarkdocConfigResult } from './load-config.js';

export async function getContentEntryType({
	markdocConfigResult,
	astroConfig,
}: {
	astroConfig: AstroConfig;
	markdocConfigResult?: MarkdocConfigResult;
}): Promise<ContentEntryType> {
	return {
		extensions: ['.mdoc'],
		getEntryInfo,
		handlePropagation: true,
		async getRenderModule({ contents, fileUrl, viteId }) {
			const entry = getEntryInfo({ contents, fileUrl });
			const tokens = markdocTokenizer.tokenize(entry.body);
			const ast = Markdoc.parse(tokens);
			const usedTags = getUsedTags(ast);
			const userMarkdocConfig = markdocConfigResult?.config ?? {};
			const markdocConfigUrl = markdocConfigResult?.fileUrl;

			let componentConfigByTagMap: Record<string, ComponentConfig> = {};
			// Only include component imports for tags used in the document.
			// Avoids style and script bleed.
			for (const tag of usedTags) {
				const render = userMarkdocConfig.tags?.[tag]?.render;
				console.log({ tag, render });
				if (isComponentConfig(render)) {
					componentConfigByTagMap[tag] = render;
				}
			}
			let componentConfigByNodeMap: Record<string, ComponentConfig> = {};
			for (const [nodeType, schema] of Object.entries(userMarkdocConfig.nodes ?? {})) {
				const render = schema?.render;
				if (isComponentConfig(render)) {
					componentConfigByNodeMap[nodeType] = render;
				}
			}

			const pluginContext = this;
			const markdocConfig = await setupConfig(userMarkdocConfig);

			const filePath = fileURLToPath(fileUrl);

			const validationErrors = Markdoc.validate(
				ast,
				/* Raised generics issue with Markdoc core https://github.com/markdoc/markdoc/discussions/400 */
				markdocConfig as MarkdocConfig
			).filter((e) => {
				return (
					// Ignore `variable-undefined` errors.
					// Variables can be configured at runtime,
					// so we cannot validate them at build time.
					e.error.id !== 'variable-undefined' &&
					(e.error.level === 'error' || e.error.level === 'critical')
				);
			});
			if (validationErrors.length) {
				// Heuristic: take number of newlines for `rawData` and add 2 for the `---` fences
				const frontmatterBlockOffset = entry.rawData.split('\n').length + 2;
				const rootRelativePath = path.relative(fileURLToPath(astroConfig.root), filePath);
				throw new MarkdocError({
					message: [
						`**${String(rootRelativePath)}** contains invalid content:`,
						...validationErrors.map((e) => `- ${e.error.message}`),
					].join('\n'),
					location: {
						// Error overlay does not support multi-line or ranges.
						// Just point to the first line.
						line: frontmatterBlockOffset + validationErrors[0].lines[0],
						file: viteId,
					},
				});
			}

			if (astroConfig.experimental.assets) {
				await emitOptimizedImages(ast.children, {
					astroConfig,
					pluginContext,
					filePath,
				});
			}

			const res = `import {
	createComponent,
	renderComponent,
} from 'astro/runtime/server/index.js';
import { Renderer } from '@astrojs/markdoc/components';
import { collectHeadings, setupConfigSync, createContentComponent, Markdoc } from '@astrojs/markdoc/runtime';
${
	markdocConfigUrl
		? `import markdocConfig from ${JSON.stringify(markdocConfigUrl.pathname)};`
		: 'const markdocConfig = {};'
}${
				astroConfig.experimental.assets
					? `\nimport { experimentalAssetsConfig } from '@astrojs/markdoc/experimental-assets-config';
markdocConfig.nodes = { ...experimentalAssetsConfig.nodes, ...markdocConfig.nodes };`
					: ''
			}

${getStringifiedImports(componentConfigByTagMap, 'Tag')}
${getStringifiedImports(componentConfigByNodeMap, 'Node')}

const tagComponentMap = ${getStringifiedMap(componentConfigByTagMap, 'Tag')};
const nodeComponentMap = ${getStringifiedMap(componentConfigByNodeMap, 'Node')};

const stringifiedAst = ${JSON.stringify(
				/* Double stringify to encode *as* stringified JSON */ JSON.stringify(ast)
			)};
export function getHeadings() {
	${
		/* Yes, we are transforming twice (once from `getHeadings()` and again from <Content /> in case of variables).
		TODO: propose new `render()` API to allow Markdoc variable passing to `render()` itself,
		instead of the Content component. Would remove double-transform and unlock variable resolution in heading slugs. */
		''
	}
	const config = setupConfigSync();
	const ast = Markdoc.Ast.fromJSON(stringifiedAst);
	const content = Markdoc.transform(ast, config);
	return collectHeadings(Array.isArray(content) ? content : content.children);
}

export const Content = createContentComponent(
	Renderer,
	stringifiedAst,
	markdocConfig,
	tagComponentMap,
	nodeComponentMap,
)`;
			return { code: res };
		},
		contentModuleTypes: await fs.promises.readFile(
			new URL('../template/content-module-types.d.ts', import.meta.url),
			'utf-8'
		),
	};
}

const markdocTokenizer = new Markdoc.Tokenizer({
	// Strip <!-- comments --> from rendered output
	// Without this, they're rendered as strings!
	allowComments: true,
});

function getUsedTags(markdocAst: Node) {
	const tags = new Set<string>();
	const validationErrors = Markdoc.validate(markdocAst);
	// Hack: run the validator with an empty config and look for 'tag-undefined'.
	// This is our signal that a tag is being used!
	for (const { error } of validationErrors) {
		if (error.id === 'tag-undefined') {
			const [, tagName] = error.message.match(/Undefined tag: '(.*)'/) ?? [];
			tags.add(tagName);
		}
	}
	return tags;
}

function getEntryInfo({ fileUrl, contents }: { fileUrl: URL; contents: string }) {
	const parsed = parseFrontmatter(contents, fileURLToPath(fileUrl));
	return {
		data: parsed.data,
		body: parsed.content,
		slug: parsed.data.slug,
		rawData: parsed.matter,
	};
}

/**
 * Emits optimized images, and appends the generated `src` to each AST node
 * via the `__optimizedSrc` attribute.
 */
async function emitOptimizedImages(
	nodeChildren: Node[],
	ctx: {
		pluginContext: rollup.PluginContext;
		filePath: string;
		astroConfig: AstroConfig;
	}
) {
	for (const node of nodeChildren) {
		if (
			node.type === 'image' &&
			typeof node.attributes.src === 'string' &&
			shouldOptimizeImage(node.attributes.src)
		) {
			// Attempt to resolve source with Vite.
			// This handles relative paths and configured aliases
			const resolved = await ctx.pluginContext.resolve(node.attributes.src, ctx.filePath);

			if (resolved?.id && fs.existsSync(new URL(prependForwardSlash(resolved.id), 'file://'))) {
				const src = await emitESMImage(
					resolved.id,
					ctx.pluginContext.meta.watchMode,
					ctx.pluginContext.emitFile,
					{ config: ctx.astroConfig }
				);
				node.attributes.__optimizedSrc = src;
			} else {
				throw new MarkdocError({
					message: `Could not resolve image ${JSON.stringify(
						node.attributes.src
					)} from ${JSON.stringify(ctx.filePath)}. Does the file exist?`,
				});
			}
		}
		await emitOptimizedImages(node.children, ctx);
	}
}

function shouldOptimizeImage(src: string) {
	// Optimize anything that is NOT external or an absolute path to `public/`
	return !isValidUrl(src) && !src.startsWith('/');
}

function getStringifiedImports(
	componentConfigMap: Record<string, ComponentConfig>,
	componentNamePrefix: string
) {
	let stringifiedComponentImports = '';
	for (const [key, config] of Object.entries(componentConfigMap)) {
		const importName = config.namedExport
			? `{ ${config.namedExport} as ${componentNamePrefix + key} }`
			: componentNamePrefix + key;

		stringifiedComponentImports += `import ${importName} from ${JSON.stringify(config.path)};\n`;
	}
	return stringifiedComponentImports;
}

function getStringifiedMap(
	componentConfigMap: Record<string, ComponentConfig>,
	componentNamePrefix: string
) {
	let stringifiedComponentMap = '{';
	for (const key in componentConfigMap) {
		stringifiedComponentMap += `${key}: ${componentNamePrefix + key},\n`;
	}
	stringifiedComponentMap += '}';
	return stringifiedComponentMap;
}

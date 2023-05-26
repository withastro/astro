import { isPropsDef, markdocAttributesFromZodProps, usedDefinePropsSymbol } from './props.js';
/* eslint-disable no-console */
import type { Node, Schema } from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';
import glob from 'fast-glob';
import type { AstroConfig, AstroIntegration, ContentEntryType, HookParameters } from 'astro';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isValidUrl, MarkdocError, parseFrontmatter, prependForwardSlash } from './utils.js';
// @ts-expect-error Cannot find module 'astro/assets' or its corresponding type declarations.
import { emitESMImage } from 'astro/assets';
import { bold, red, yellow } from 'kleur/colors';
import type * as rollup from 'rollup';
import { loadMarkdocConfig, type MarkdocConfigResult } from './load-config.js';
import { setupConfig } from './runtime.js';
import path from 'node:path';
import type { Plugin } from 'vite';

type SetupHookParams = HookParameters<'astro:config:setup'> & {
	// `contentEntryType` is not a public API
	// Add type defs here
	addContentEntryType: (contentEntryType: ContentEntryType) => void;
};

export default function markdocIntegration(legacyConfig?: any): AstroIntegration {
	if (legacyConfig) {
		console.log(
			`${red(
				bold('[Markdoc]')
			)} Passing Markdoc config from your \`astro.config\` is no longer supported. Configuration should be exported from a \`markdoc.config.mjs\` file. See the configuration docs for more: https://docs.astro.build/en/guides/integrations-guide/markdoc/#configuration`
		);
		process.exit(0);
	}
	let markdocConfigResult: MarkdocConfigResult | undefined;

	return {
		name: '@astrojs/markdoc',
		hooks: {
			'astro:config:setup': async (params) => {
				const {
					config: astroConfig,
					updateConfig,
					addContentEntryType,
				} = params as SetupHookParams;
				const embedsVirtualModId = 'astro:markdoc-embeds';

				const tagPropsModules = await glob(
					fileURLToPath(new URL('./embeds/*.props.js', astroConfig.srcDir)),
					{ absolute: true }
				);
				let componentAttrsByName: Record<string, Schema> = {};
				let componentPathByName: Record<string, string> = {};
				const embedsDir = new URL('embeds/', astroConfig.srcDir);
				for (const tagPropsModule of tagPropsModules) {
					const mod = await import(tagPropsModule);
					if (typeof mod !== 'object' || mod == null) {
						throw new MarkdocError({
							message: `${tagPropsModule} does not export a \`props\` object.`,
						});
					}
					const { props } = mod;
					if (isPropsDef(props)) {
						const compName = path
							.relative(fileURLToPath(embedsDir), tagPropsModule)
							.replace('.props.js', '');
						componentAttrsByName[compName] = markdocAttributesFromZodProps(props);
						componentPathByName[compName] = tagPropsModule.replace(/\.props\.js$/, '.astro');
					} else {
						throw new MarkdocError({
							message: `\`props\` exports must use the \`defineProps()\` helper.`,
						});
					}
				}

				updateConfig({
					vite: {
						ssr: {
							external: ['@astrojs/markdoc/prism', '@astrojs/markdoc/shiki'],
						},
						plugins: [
							{
								name: 'astro:markdoc-embeds',
								resolveId(id) {
									if (id === embedsVirtualModId) {
										return '\0' + embedsVirtualModId;
									}
								},
								async load(id) {
									if (id === '\0' + embedsVirtualModId) {
										const code = `${Object.entries(componentPathByName)
											.map(([name, path]) => {
												return `import ${name} from ${JSON.stringify(
													pathToFileURL(path).pathname
												)}`;
											})
											.join('\n')}
										export const tagConfig = {
											${Object.entries(componentAttrsByName)
												.map(([name, attributes]) => {
													return `${JSON.stringify(name)}: {
	attributes: ${JSON.stringify(attributes)},
	render: ${name},
}`;
												})
												.join(',\n')}
									};`;
										console.log(code);
										return code;
									}
								},
							} as Plugin,
						],
					},
				});

				markdocConfigResult = await loadMarkdocConfig(astroConfig);
				const userMarkdocConfig = markdocConfigResult?.config ?? {};

				function getEntryInfo({ fileUrl, contents }: { fileUrl: URL; contents: string }) {
					const parsed = parseFrontmatter(contents, fileURLToPath(fileUrl));
					return {
						data: parsed.data,
						body: parsed.content,
						slug: parsed.data.slug,
						rawData: parsed.matter,
					};
				}
				addContentEntryType({
					extensions: ['.mdoc'],
					getEntryInfo,
					async getRenderModule({ entry, viteId }) {
						const ast = Markdoc.parse(entry.body);
						const pluginContext = this;
						const markdocConfig = await setupConfig(userMarkdocConfig, entry);

						const validationErrors = Markdoc.validate(ast, markdocConfig).filter((e) => {
							return (
								// Ignore `variable-undefined` errors.
								// Variables can be configured at runtime,
								// so we cannot validate them at build time.
								e.error.id !== 'variable-undefined' &&
								e.error.id !== 'tag-undefined' &&
								(e.error.level === 'error' || e.error.level === 'critical')
							);
						});
						if (validationErrors.length) {
							// Heuristic: take number of newlines for `rawData` and add 2 for the `---` fences
							const frontmatterBlockOffset = entry._internal.rawData.split('\n').length + 2;
							throw new MarkdocError({
								message: [
									`**${String(entry.collection)} → ${String(entry.id)}** contains invalid content:`,
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
								filePath: entry._internal.filePath,
							});
						}

						const res = `import { jsx as h } from 'astro/jsx-runtime';
import { Renderer } from '@astrojs/markdoc/components';
import { tagConfig } from ${JSON.stringify(embedsVirtualModId)};
import { collectHeadings, setupConfig, setupConfigSync, Markdoc } from '@astrojs/markdoc/runtime';
import * as entry from ${JSON.stringify(viteId + '?astroContentCollectionEntry')};
${
	markdocConfigResult
		? `import _userConfig from ${JSON.stringify(
				markdocConfigResult.fileUrl.pathname
		  )};\nconst userConfig = _userConfig ?? {};`
		: 'const userConfig = {};'
}${
							astroConfig.experimental.assets
								? `\nimport { experimentalAssetsConfig } from '@astrojs/markdoc/experimental-assets-config';\nuserConfig.nodes = { ...experimentalAssetsConfig.nodes, ...userConfig.nodes };`
								: ''
						}
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
	const headingConfig = userConfig.nodes?.heading;
	const config = setupConfigSync(headingConfig ? { nodes: { heading: headingConfig } } : {}, entry);
	const ast = Markdoc.Ast.fromJSON(stringifiedAst);
	const content = Markdoc.transform(ast, config);
	return collectHeadings(Array.isArray(content) ? content : content.children);
}
export async function Content (props) {
	const config = await setupConfig({
		...userConfig,
		tags: {
			...tagConfig,
			...userConfig.tags,
		},
		variables: { ...userConfig.variables, ...props },
	}, entry);

	return h(Renderer, { config, stringifiedAst });
}`;
						return { code: res };
					},
					contentModuleTypes: await fs.promises.readFile(
						new URL('../template/content-module-types.d.ts', import.meta.url),
						'utf-8'
					),
				});
			},
			'astro:server:setup': async ({ server }) => {
				server.watcher.on('all', (event, entry) => {
					if (pathToFileURL(entry).pathname === markdocConfigResult?.fileUrl.pathname) {
						console.log(
							yellow(
								`${bold('[Markdoc]')} Restart the dev server for config changes to take effect.`
							)
						);
					}
				});
			},
		},
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

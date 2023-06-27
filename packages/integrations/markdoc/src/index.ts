/* eslint-disable no-console */
import type { Config as MarkdocConfig, Node } from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';
import type { AstroConfig, AstroIntegration, ContentEntryType, HookParameters } from 'astro';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
	hasContentFlag,
	isValidUrl,
	MarkdocError,
	parseFrontmatter,
	prependForwardSlash,
	PROPAGATED_ASSET_FLAG,
} from './utils.js';
// @ts-expect-error Cannot find module 'astro/assets' or its corresponding type declarations.
import { emitESMImage } from 'astro/assets';
import { bold, red } from 'kleur/colors';
import path from 'node:path';
import type * as rollup from 'rollup';
import { normalizePath } from 'vite';
import {
	loadMarkdocConfig,
	SUPPORTED_MARKDOC_CONFIG_FILES,
	type MarkdocConfigResult,
} from './load-config.js';
import { setupConfig } from './runtime.js';

type SetupHookParams = HookParameters<'astro:config:setup'> & {
	// `contentEntryType` is not a public API
	// Add type defs here
	addContentEntryType: (contentEntryType: ContentEntryType) => void;
};

const markdocTokenizer = new Markdoc.Tokenizer({
	// Strip <!-- comments --> from rendered output
	// Without this, they're rendered as strings!
	allowComments: true,
});

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
	let markdocConfigResultId = '';
	let astroConfig: AstroConfig;
	return {
		name: '@astrojs/markdoc',
		hooks: {
			'astro:config:setup': async (params) => {
				const { updateConfig, addContentEntryType } = params as SetupHookParams;
				astroConfig = params.config;

				markdocConfigResult = await loadMarkdocConfig(astroConfig);
				if (markdocConfigResult) {
					markdocConfigResultId = normalizePath(fileURLToPath(markdocConfigResult.fileUrl));
				}
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
					// Markdoc handles script / style propagation
					// for Astro components internally
					handlePropagation: false,
					async getRenderModule({ contents, fileUrl, viteId }) {
						const entry = getEntryInfo({ contents, fileUrl });
						const tokens = markdocTokenizer.tokenize(entry.body);
						const ast = Markdoc.parse(tokens);
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
						import { collectHeadings, setupConfig, setupConfigSync, Markdoc } from '@astrojs/markdoc/runtime';
${
	markdocConfigResult
		? `import _userConfig from ${JSON.stringify(
				markdocConfigResultId
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
	const config = setupConfigSync(headingConfig ? { nodes: { heading: headingConfig } } : {});
	const ast = Markdoc.Ast.fromJSON(stringifiedAst);
	const content = Markdoc.transform(ast, config);
	return collectHeadings(Array.isArray(content) ? content : content.children);
}

export const Content = createComponent({
	async factory(result, props) {
		const config = await setupConfig({
			...userConfig,
			variables: { ...userConfig.variables, ...props },
		});
		
		return renderComponent(
			result,
			Renderer.name,
			Renderer,
			{ stringifiedAst, config },
			{}
		);
	},
	propagation: 'self',
});`;
						return { code: res };
					},
					contentModuleTypes: await fs.promises.readFile(
						new URL('../template/content-module-types.d.ts', import.meta.url),
						'utf-8'
					),
				});

				let rollupOptions: rollup.RollupOptions = {};
				if (markdocConfigResult) {
					rollupOptions = {
						output: {
							// Split Astro components from your `markdoc.config`
							// to only inject component styles and scripts at runtime.
							manualChunks(id, { getModuleInfo }) {
								if (
									markdocConfigResult &&
									hasContentFlag(id, PROPAGATED_ASSET_FLAG) &&
									getModuleInfo(id)?.importers?.includes(markdocConfigResultId)
								) {
									return createNameHash(id, [id]);
								}
							},
						},
					};
				}

				updateConfig({
					vite: {
						ssr: {
							external: ['@astrojs/markdoc/prism', '@astrojs/markdoc/shiki'],
						},
						build: {
							rollupOptions,
						},
						plugins: [
							{
								name: '@astrojs/markdoc:astro-propagated-assets',
								enforce: 'pre',
								// Astro component styles and scripts should only be injected
								// When a given Markdoc file actually uses that component.
								// Add the `astroPropagatedAssets` flag to inject only when rendered.
								resolveId(this: rollup.TransformPluginContext, id: string, importer: string) {
									if (importer === markdocConfigResultId && id.endsWith('.astro')) {
										return this.resolve(id + '?astroPropagatedAssets', importer, {
											skipSelf: true,
										});
									}
								},
							},
						],
					},
				});
			},
			'astro:server:setup': async ({ server }) => {
				server.watcher.on('all', (event, entry) => {
					if (SUPPORTED_MARKDOC_CONFIG_FILES.some((f) => entry.endsWith(f))) {
						server.restart();
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

/**
 * Create build hash for manual Rollup chunks.
 * @see 'packages/astro/src/core/build/plugins/plugin-css.ts'
 */
function createNameHash(baseId: string, hashIds: string[]): string {
	const baseName = baseId ? path.parse(baseId).name : 'index';
	const hash = crypto.createHash('sha256');
	for (const id of hashIds) {
		hash.update(id, 'utf-8');
	}
	const h = hash.digest('hex').slice(0, 8);
	const proposedName = baseName + '.' + h;
	return proposedName;
}

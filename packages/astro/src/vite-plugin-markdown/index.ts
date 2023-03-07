import { renderMarkdown } from '@astrojs/markdown-remark';
import {
	InvalidAstroDataError,
	safelyGetAstroData,
} from '@astrojs/markdown-remark/dist/internal.js';
import fs from 'fs';
import matter from 'gray-matter';
import npath from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PluginContext } from 'rollup';
import { pathToFileURL } from 'url';
import type { Plugin } from 'vite';
import { normalizePath } from 'vite';
import type { AstroSettings } from '../@types/astro';
import { imageMetadata } from '../assets/index.js';
import { AstroError, AstroErrorData, MarkdownError } from '../core/errors/index.js';
import type { LogOptions } from '../core/logger/core.js';
import { warn } from '../core/logger/core.js';
import { isMarkdownFile } from '../core/util.js';
import type { PluginMetadata } from '../vite-plugin-astro/types.js';
import { escapeViteEnvReferences, getFileInfo } from '../vite-plugin-utils/index.js';

interface AstroPluginOptions {
	settings: AstroSettings;
	logging: LogOptions;
}

function safeMatter(source: string, id: string) {
	try {
		return matter(source);
	} catch (err: any) {
		const markdownError = new MarkdownError({
			code: AstroErrorData.UnknownMarkdownError.code,
			message: err.message,
			stack: err.stack,
			location: {
				file: id,
			},
		});

		if (err.name === 'YAMLException') {
			markdownError.setErrorCode(AstroErrorData.MarkdownFrontmatterParseError.code);
			markdownError.setLocation({
				file: id,
				line: err.mark.line,
				column: err.mark.column,
			});

			markdownError.setMessage(err.reason);
		}

		throw markdownError;
	}
}

// absolute path of "astro/jsx-runtime"
const astroJsxRuntimeModulePath = normalizePath(
	fileURLToPath(new URL('../jsx-runtime/index.js', import.meta.url))
);

export default function markdown({ settings, logging }: AstroPluginOptions): Plugin {
	const markdownAssetMap = new Map<string, string>();

	async function resolveImage(this: PluginContext, fileId: string, path: string) {
		const resolved = await this.resolve(path, fileId);
		if (!resolved) return path;
		const rel = npath.relative(normalizePath(fileURLToPath(settings.config.root)), resolved.id);
		const buffer = await fs.promises.readFile(resolved.id);
		// This conditional has to be here, to prevent race conditions on setting the map
		if (markdownAssetMap.has(resolved.id)) {
			return `ASTRO_ASSET_MD_${markdownAssetMap.get(resolved.id)!}`;
		}
		const file = this.emitFile({
			type: 'asset',
			name: rel,
			source: buffer,
		});
		markdownAssetMap.set(resolved.id, file);
		return `ASTRO_ASSET_MD_${file}`;
	}

	return {
		enforce: 'pre',
		name: 'astro:markdown',
		// Why not the "transform" hook instead of "load" + readFile?
		// A: Vite transforms all "import.meta.env" references to their values before
		// passing to the transform hook. This lets us get the truly raw value
		// to escape "import.meta.env" ourselves.
		async load(id) {
			if (isMarkdownFile(id)) {
				const { fileId, fileUrl } = getFileInfo(id, settings.config);
				const rawFile = await fs.promises.readFile(fileId, 'utf-8');
				const raw = safeMatter(rawFile, id);

				let imageService = undefined;
				if (settings.config.experimental.assets) {
					imageService = (await import(settings.config.image.service)).default;
				}
				const renderResult = await renderMarkdown(raw.content, {
					...settings.config.markdown,
					fileURL: new URL(`file://${fileId}`),
					frontmatter: raw.data,
					experimentalAssets: settings.config.experimental.assets,
					imageService,
					assetsDir: new URL('./assets/', settings.config.srcDir),
					resolveImage: this.meta.watchMode ? undefined : resolveImage.bind(this, fileId),
				});

				this;

				let html = renderResult.code;
				const { headings } = renderResult.metadata;
				let imagePaths: string[] = [];
				if (settings.config.experimental.assets) {
					let paths = (renderResult.vfile.data.imagePaths as string[]) ?? [];
					imagePaths = await Promise.all(
						paths.map(async (imagePath) => {
							return (await this.resolve(imagePath))?.id ?? imagePath;
						})
					);
				}

				const astroData = safelyGetAstroData(renderResult.vfile.data);
				if (astroData instanceof InvalidAstroDataError) {
					throw new AstroError(AstroErrorData.InvalidFrontmatterInjectionError);
				}

				const { frontmatter } = astroData;
				const { layout } = frontmatter;

				if (frontmatter.setup) {
					warn(
						logging,
						'markdown',
						`[${id}] Astro now supports MDX! Support for components in ".md" (or alternative extensions like ".markdown") files using the "setup" frontmatter is no longer enabled by default. Migrate this file to MDX.`
					);
				}

				const code = escapeViteEnvReferences(`
				import { Fragment, jsx as h } from ${JSON.stringify(astroJsxRuntimeModulePath)};
				${layout ? `import Layout from ${JSON.stringify(layout)};` : ''}
				${
					settings.config.experimental.assets
						? 'import { getConfiguredImageService } from "astro:assets";\ngetConfiguredImageService();'
						: ''
				}

				const images = {
					${imagePaths.map((entry) => `'${entry}': await import('${entry}')`)}
				}

				const html = ${JSON.stringify(html)};

				export const frontmatter = ${JSON.stringify(frontmatter)};
				export const file = ${JSON.stringify(fileId)};
				export const url = ${JSON.stringify(fileUrl)};
				export function rawContent() {
					return ${JSON.stringify(raw.content)};
				}
				export function compiledContent() {
					return html;
				}
				export function getHeadings() {
					return ${JSON.stringify(headings)};
				}
				export async function Content() {
					const { layout, ...content } = frontmatter;
					content.file = file;
					content.url = url;
					const contentFragment = h(Fragment, { 'set:html': html });
					return ${
						layout
							? `h(Layout, {
									file,
									url,
									content,
									frontmatter: content,
									headings: getHeadings(),
									rawContent,
									compiledContent,
									'server:root': true,
									children: contentFragment
								})`
							: `contentFragment`
					};
				}
				Content[Symbol.for('astro.needsHeadRendering')] = ${layout ? 'false' : 'true'};
				export default Content;
				`);

				return {
					code,
					meta: {
						astro: {
							hydratedComponents: [],
							clientOnlyComponents: [],
							scripts: [],
							propagation: 'none',
							pageOptions: {},
						} as PluginMetadata['astro'],
						vite: {
							lang: 'ts',
						},
					},
				};
			}
		},
		async generateBundle(_opts, bundle) {
			for (const [, output] of Object.entries(bundle)) {
				if (output.type === 'asset') continue;

				if (markdownAssetMap.size) {
					const optimizedPaths = new Map<string, string>();

					for (const [filename, hash] of markdownAssetMap) {
						const image = await imageMetadata(pathToFileURL(filename));
						if (!image) {
							continue;
						}
						const fileName = this.getFileName(hash);
						image.src = npath.join(settings.config.base, fileName);
						const optimized = globalThis.astroAsset.addStaticImage!({ src: image });
						optimizedPaths.set(hash, optimized);
					}
					output.code = output.code.replace(/ASTRO_ASSET_MD_([0-9a-z]{8})/, (_str, hash) => {
						const optimizedName = optimizedPaths.get(hash);
						return optimizedName || this.getFileName(hash);
					});
				}
			}
		},
	};
}

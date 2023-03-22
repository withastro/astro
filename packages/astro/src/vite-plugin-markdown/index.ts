import { renderMarkdown } from '@astrojs/markdown-remark';
import {
	InvalidAstroDataError,
	safelyGetAstroData,
} from '@astrojs/markdown-remark/dist/internal.js';
import fs from 'fs';
import matter from 'gray-matter';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { normalizePath } from 'vite';
import type { AstroSettings } from '../@types/astro';
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

const astroServerRuntimeModulePath = normalizePath(
	fileURLToPath(new URL('../runtime/server/index.js', import.meta.url))
);

export default function markdown({ settings, logging }: AstroPluginOptions): Plugin {
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

				const renderResult = await renderMarkdown(raw.content, {
					...settings.config.markdown,
					fileURL: new URL(`file://${fileId}`),
					frontmatter: raw.data,
					experimentalAssets: settings.config.experimental.assets,
				});

				let html = renderResult.code;
				const { headings } = renderResult.metadata;
				let imagePaths: { raw: string; absolute: string }[] = [];
				if (settings.config.experimental.assets) {
					let paths = (renderResult.vfile.data.imagePaths as string[]) ?? [];
					imagePaths = await Promise.all(
						paths.map(async (imagePath) => {
							return {
								raw: imagePath,
								absolute: (await this.resolve(imagePath, id))?.id ?? imagePath,
							};
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
				import { spreadAttributes } from ${JSON.stringify(astroServerRuntimeModulePath)};

				${layout ? `import Layout from ${JSON.stringify(layout)};` : ''}
				${settings.config.experimental.assets ? 'import { getImage } from "astro:assets";' : ''}

				export const images = {
					${imagePaths.map(
						(entry) =>
							`'${entry.raw}': await getImage({src: (await import("${entry.absolute}")).default})`
					)}
				}

				function updateImageReferences(html) {
					return html.replaceAll(
						/__ASTRO_IMAGE_=\"(.+)\"/gm,
						(full, imagePath) => spreadAttributes({src: images[imagePath].src, ...images[imagePath].attributes})
					);
				}

				const html = updateImageReferences(${JSON.stringify(html)});

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
	};
}

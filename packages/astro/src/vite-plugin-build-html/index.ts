import {
	createElement,
	createScript,
	getAttribute,
	hasAttribute,
	insertBefore,
	remove,
	setAttribute,
} from '@web/parse5-utils';
import { promises as fs } from 'fs';
import parse5 from 'parse5';
import * as npath from 'path';
import type { OutputChunk, PluginContext, PreRenderedChunk } from 'rollup';
import srcsetParse from 'srcset-parse';
import type { Plugin as VitePlugin, ViteDevServer } from 'vite';
import type { AstroConfig } from '../@types/astro';
import type { BuildInternals } from '../core/build/internal';
import type { AllPagesData } from '../core/build/types';
import type { LogOptions } from '../core/logger/core.js';
import { prependDotSlash } from '../core/path.js';
import { render as ssrRender } from '../core/render/dev/index.js';
import { RouteCache } from '../core/render/route-cache.js';
import { getOutputFilename } from '../core/util.js';
import { getAstroPageStyleId, getAstroStyleId } from '../vite-plugin-build-css/index.js';
import { addRollupInput } from './add-rollup-input.js';
import {
	findAssets,
	findExternalScripts,
	findInlineScripts,
	findInlineStyles,
	getAttributes,
	getTextContent,
} from './extract-assets.js';
import {
	hasSrcSet,
	isBuildableImage,
	isBuildableLink,
	isHoistedScript,
	isInSrcDirectory,
} from './util.js';
import { createRequest } from '../core/request.js';

// This package isn't real ESM, so have to coerce it
const matchSrcset: typeof srcsetParse = (srcsetParse as any).default;

const PLUGIN_NAME = '@astro/rollup-plugin-build';
const ASTRO_PAGE_PREFIX = '@astro-page';
const ASTRO_SCRIPT_PREFIX = '@astro-script';

const ASTRO_EMPTY = '@astro-empty';

interface PluginOptions {
	astroConfig: AstroConfig;
	internals: BuildInternals;
	logging: LogOptions;
	allPages: AllPagesData;
	pageNames: string[];
	origin: string;
	routeCache: RouteCache;
	viteServer: ViteDevServer;
}

function relativePath(from: string, to: string): string {
	const rel = npath.posix.relative(from, to);
	return prependDotSlash(rel);
}

export function rollupPluginAstroScanHTML(options: PluginOptions): VitePlugin {
	const { astroConfig, internals, logging, origin, allPages, routeCache, viteServer, pageNames } =
		options;

	// The filepath root of the src folder
	const srcRoot = astroConfig.srcDir.pathname;
	// The web path of the src folter
	const srcRootWeb = srcRoot.substr(astroConfig.root.pathname.length - 1);

	// A map of pages to rendered HTML
	const renderedPageMap = new Map<string, string>();

	//
	const astroScriptMap = new Map<string, string>();
	const astroPageMap = new Map<string, string>();
	const astroAssetMap = new Map<string, Promise<Buffer>>();

	const cssChunkMap = new Map<string, string[]>();
	const pageStyleImportOrder: string[] = [];

	return {
		name: PLUGIN_NAME,

		enforce: 'pre',

		async options(inputOptions) {
			const htmlInput: Set<string> = new Set();
			const assetInput: Set<string> = new Set();
			const jsInput: Set<string> = new Set();

			for (const [component, pageData] of Object.entries(allPages)) {
				const [renderers, mod] = pageData.preload;

				// Hydrated components are statically identified.
				for (const path of mod.$$metadata.hydratedComponentPaths()) {
					jsInput.add(path);
				}

				for (const pathname of pageData.paths) {
					pageNames.push(pathname.replace(/\/?$/, '/').replace(/^\//, ''));
					const id = ASTRO_PAGE_PREFIX + pathname;
					const response = await ssrRender(renderers, mod, {
						astroConfig,
						filePath: new URL(`./${component}`, astroConfig.root),
						logging,
						request: createRequest({
							url: new URL(origin + pathname),
							headers: new Headers(),
							logging,
							ssr: false,
						}),
						mode: 'production',
						origin,
						pathname,
						route: pageData.route,
						routeCache,
						viteServer,
					});

					if (response.type !== 'html') {
						continue;
					}

					const html = response.html;
					renderedPageMap.set(id, html);

					const document = parse5.parse(html, {
						sourceCodeLocationInfo: true,
					});

					const frontEndImports = [];
					for (const script of findInlineScripts(document)) {
						const astroScript = getAttribute(script, 'astro-script');
						if (astroScript) {
							const js = getTextContent(script);
							const scriptId = ASTRO_SCRIPT_PREFIX + astroScript;
							frontEndImports.push(scriptId);
							astroScriptMap.set(scriptId, js);
						}
					}

					for (const script of findExternalScripts(document)) {
						if (isHoistedScript(script)) {
							const astroScript = getAttribute(script, 'astro-script');
							const src = getAttribute(script, 'src');
							if (astroScript) {
								const js = `import '${src}';`;
								const scriptId = ASTRO_SCRIPT_PREFIX + astroScript;
								frontEndImports.push(scriptId);
								astroScriptMap.set(scriptId, js);
							}
						} else if (isInSrcDirectory(script, 'src', srcRoot, srcRootWeb)) {
							const src = getAttribute(script, 'src');
							if (src) jsInput.add(src);
						}
					}

					const assetImports = [];
					const styleId = getAstroStyleId(pathname);
					let styles = 0;
					for (const node of findInlineStyles(document)) {
						if (hasAttribute(node, 'astro-style')) {
							const style = getTextContent(node) || ' '; // If an empty node, add whitespace
							const thisStyleId = `${styleId}/${++styles}.css`;
							internals.astroStyleMap.set(thisStyleId, style);
							assetImports.push(thisStyleId);
						}
					}

					for (let node of findAssets(document)) {
						if (isBuildableLink(node, srcRoot, srcRootWeb)) {
							const href = getAttribute(node, 'href')!;
							assetImports.push(href);
						}

						if (isBuildableImage(node, srcRoot, srcRootWeb)) {
							const src = getAttribute(node, 'src');
							if (src?.startsWith(srcRoot) && !astroAssetMap.has(src)) {
								astroAssetMap.set(src, fs.readFile(new URL(`file://${src}`)));
							} else if (src?.startsWith(srcRootWeb) && !astroAssetMap.has(src)) {
								const resolved = new URL('.' + src, astroConfig.root);
								astroAssetMap.set(src, fs.readFile(resolved));
							}
						}

						if (hasSrcSet(node)) {
							const candidates = matchSrcset(getAttribute(node, 'srcset')!);
							for (const { url } of candidates) {
								if (url.startsWith(srcRoot) && !astroAssetMap.has(url)) {
									astroAssetMap.set(url, fs.readFile(new URL(`file://${url}`)));
								} else if (url.startsWith(srcRootWeb) && !astroAssetMap.has(url)) {
									const resolved = new URL('.' + url, astroConfig.root);
									astroAssetMap.set(url, fs.readFile(resolved));
								}
							}
						}
					}

					if (frontEndImports.length) {
						htmlInput.add(id);
						const jsSource = frontEndImports.map((sid) => `import '${sid}';`).join('\n');
						astroPageMap.set(id, jsSource);
					}

					if (assetImports.length) {
						const pageStyleId = getAstroPageStyleId(pathname);
						const jsSource = assetImports.map((sid) => `import '${sid}';`).join('\n');
						internals.astroPageStyleMap.set(pageStyleId, jsSource);
						assetInput.add(pageStyleId);

						// preserve asset order in the order we encounter them
						for (const assetHref of assetImports) {
							if (!pageStyleImportOrder.includes(assetHref)) pageStyleImportOrder.push(assetHref);
						}
					}
				}
			}

			const allInputs = new Set([...jsInput, ...htmlInput, ...assetInput]);
			// You always need at least 1 input, so add an placeholder just so we can build HTML/CSS
			if (!allInputs.size) {
				allInputs.add(ASTRO_EMPTY);
			}
			const outOptions = addRollupInput(inputOptions, Array.from(allInputs));
			return outOptions;
		},

		async resolveId(id) {
			switch (true) {
				case astroScriptMap.has(id):
				case astroPageMap.has(id):
				case id === ASTRO_EMPTY: {
					return id;
				}
			}

			return undefined;
		},

		async load(id) {
			// Load pages
			if (astroPageMap.has(id)) {
				return astroPageMap.get(id)!;
			}
			// Load scripts
			if (astroScriptMap.has(id)) {
				return astroScriptMap.get(id)!;
			}
			// Give this module actual code so it doesnt warn about an empty chunk
			if (id === ASTRO_EMPTY) {
				return 'console.log("empty");';
			}

			return null;
		},

		outputOptions(outputOptions) {
			Object.assign(outputOptions, {
				entryFileNames(chunk: PreRenderedChunk) {
					// Removes the `@astro-page` prefix from JS chunk names.
					if (chunk.name.startsWith(ASTRO_PAGE_PREFIX)) {
						let pageName = chunk.name.substr(ASTRO_PAGE_PREFIX.length + 1);
						if (!pageName) {
							pageName = 'index';
						}
						return `assets/${pageName}.[hash].js`;
					}
					return 'assets/[name].[hash].js';
				},
			});
			return outputOptions;
		},

		async generateBundle(this: PluginContext, _options, bundle) {
			const facadeIdMap = new Map<string, string>();
			for (const [chunkId, output] of Object.entries(bundle)) {
				if (output.type === 'chunk') {
					const chunk = output as OutputChunk;
					const id = chunk.facadeModuleId;
					if (id === ASTRO_EMPTY) {
						delete bundle[chunkId];
					} else if (id) {
						facadeIdMap.set(id, chunk.fileName);
					}
				}
			}

			// Emit assets (images, etc)
			const assetIdMap = new Map<string, string>();
			for (const [assetPath, dataPromise] of astroAssetMap) {
				const referenceId = this.emitFile({
					type: 'asset',
					name: npath.basename(assetPath),
					source: await dataPromise,
				});
				assetIdMap.set(assetPath, referenceId);
			}

			// Sort CSS in order of appearance in HTML (pageStyleImportOrder)
			// This is the “global ordering” used below
			const sortedCSSChunks = [...internals.pureCSSChunks];
			sortedCSSChunks.sort((a, b) => {
				let aIndex = Math.min(
					...Object.keys(a.modules).map((id) => {
						const i = pageStyleImportOrder.findIndex((url) => id.endsWith(url));
						return i >= 0 ? i : Infinity; // if -1 is encountered (unknown order), move to the end (Infinity)
					})
				);
				let bIndex = Math.min(
					...Object.keys(b.modules).map((id) => {
						const i = pageStyleImportOrder.findIndex((url) => id.endsWith(url));
						return i >= 0 ? i : Infinity;
					})
				);
				return aIndex - bIndex;
			});
			const sortedChunkNames = sortedCSSChunks.map(({ fileName }) => fileName);

			// Create a mapping of chunks to dependent chunks, used to add the proper
			// link tags for CSS.
			for (const chunk of sortedCSSChunks) {
				const chunkModules = [chunk.fileName, ...chunk.imports];
				// For each HTML output, sort CSS in HTML order Note: here we actually
				// want -1 to be first. Since the last CSS “wins”, we want to load
				// “unknown” (-1) CSS ordering first, followed by “known” ordering at
				// the end so it takes priority
				chunkModules.sort((a, b) => sortedChunkNames.indexOf(a) - sortedChunkNames.indexOf(b));

				const referenceIDs: string[] = [];
				for (const chunkID of chunkModules) {
					const referenceID = internals.chunkToReferenceIdMap.get(chunkID);
					if (referenceID) referenceIDs.push(referenceID);
				}
				for (const id of Object.keys(chunk.modules)) {
					cssChunkMap.set(id, referenceIDs);
				}
			}

			// Keep track of links added so we don't do so twice.
			const linkChunksAdded = new Set<string>();
			const appendStyleChunksBefore = (
				ref: parse5.Element,
				pathname: string,
				referenceIds: string[] | undefined,
				attrs: Record<string, any> = {}
			) => {
				let added = false;
				if (referenceIds) {
					const lastNode = ref;
					for (const referenceId of referenceIds) {
						const chunkFileName = this.getFileName(referenceId);
						const relPath = relativePath(pathname, '/' + chunkFileName);

						// This prevents added links more than once per type.
						const key = pathname + relPath + attrs.rel || 'stylesheet';
						if (!linkChunksAdded.has(key)) {
							linkChunksAdded.add(key);
							insertBefore(
								lastNode.parentNode,
								createElement('link', {
									rel: 'stylesheet',
									...attrs,
									href: relPath,
								}),
								lastNode
							);
							added = true;
						}
					}
				}
				return added;
			};

			for (const [id, html] of renderedPageMap) {
				const pathname = id.substr(ASTRO_PAGE_PREFIX.length);
				const document = parse5.parse(html, {
					sourceCodeLocationInfo: true,
				});

				// This is the module for the page-level bundle which includes
				// hoisted scripts and hydrated components.
				const pageAssetId = facadeIdMap.get(id);
				const bundlePath = '/' + pageAssetId;

				// Update scripts
				let pageBundleAdded = false;

				// Update inline scripts. These could be hydrated component scripts or hoisted inline scripts
				for (let script of findInlineScripts(document)) {
					if (getAttribute(script, 'astro-script') && typeof pageAssetId === 'string') {
						if (!pageBundleAdded) {
							pageBundleAdded = true;
							const relPath = relativePath(pathname, bundlePath);
							insertBefore(
								script.parentNode,
								createScript({
									type: 'module',
									src: relPath,
								}),
								script
							);
						}
						remove(script);
					}
				}

				// Update external scripts. These could be hoisted or in the src folder.
				for (let script of findExternalScripts(document)) {
					if (getAttribute(script, 'astro-script') && typeof pageAssetId === 'string') {
						if (!pageBundleAdded) {
							pageBundleAdded = true;
							const relPath = relativePath(pathname, bundlePath);
							insertBefore(
								script.parentNode,
								createScript({
									type: 'module',
									src: relPath,
								}),
								script
							);
						}
						remove(script);
					} else if (isInSrcDirectory(script, 'src', srcRoot, srcRootWeb)) {
						let src = getAttribute(script, 'src');
						// If this is projectRoot relative, get the fullpath to match the facadeId.
						if (src?.startsWith(srcRootWeb)) {
							src = new URL('.' + src, astroConfig.root).pathname;
						}
						// On windows the facadeId doesn't start with / but does not Unix :/
						if (src && (facadeIdMap.has(src) || facadeIdMap.has(src.substr(1)))) {
							const assetRootPath = '/' + (facadeIdMap.get(src) || facadeIdMap.get(src.substr(1)));
							const relPath = relativePath(pathname, assetRootPath);
							const attrs = getAttributes(script);
							insertBefore(
								script.parentNode,
								createScript({
									...attrs,
									src: relPath,
								}),
								script
							);
							remove(script);
						}
					}
				}

				const styleId = getAstroPageStyleId(pathname);
				let pageCSSAdded = false;
				for (const node of findAssets(document)) {
					if (isBuildableLink(node, srcRoot, srcRootWeb)) {
						const rel = getAttribute(node, 'rel');
						switch (rel) {
							case 'stylesheet': {
								if (!pageCSSAdded) {
									const attrs = getAttributes(node);
									delete attrs['data-astro-injected'];
									pageCSSAdded = appendStyleChunksBefore(
										node,
										pathname,
										cssChunkMap.get(styleId),
										attrs
									);
								}
								remove(node);
								break;
							}
							case 'preload': {
								if (getAttribute(node, 'as') === 'style') {
									const attrs = getAttributes(node);
									appendStyleChunksBefore(node, pathname, cssChunkMap.get(styleId), attrs);
									remove(node);
								}
							}
						}
					}

					if (isBuildableImage(node, srcRoot, srcRootWeb)) {
						const src = getAttribute(node, 'src')!;
						const referenceId = assetIdMap.get(src);
						if (referenceId) {
							const fileName = this.getFileName(referenceId);
							const relPath = relativePath(pathname, '/' + fileName);
							setAttribute(node, 'src', relPath);
						}
					}

					// Could be a `source` or an `img`.
					if (hasSrcSet(node)) {
						const srcset = getAttribute(node, 'srcset')!;
						let changedSrcset = srcset;
						const urls = matchSrcset(srcset).map((c) => c.url);
						for (const url of urls) {
							if (assetIdMap.has(url)) {
								const referenceId = assetIdMap.get(url)!;
								const fileName = this.getFileName(referenceId);
								const relPath = relativePath(pathname, '/' + fileName);
								changedSrcset = changedSrcset.replace(url, relPath);
							}
						}
						// If anything changed, update it
						if (changedSrcset !== srcset) {
							setAttribute(node, 'srcset', changedSrcset);
						}
					}
				}

				// Page styles for <style> usage, if not already appended via links.
				for (const style of findInlineStyles(document)) {
					if (hasAttribute(style, 'astro-style')) {
						if (!pageCSSAdded) {
							pageCSSAdded = appendStyleChunksBefore(style, pathname, cssChunkMap.get(styleId));
						}

						remove(style);
					}
				}

				const outHTML = parse5.serialize(document);
				const name = pathname.substr(1);
				const outPath = getOutputFilename(astroConfig, name);

				this.emitFile({
					fileName: outPath,
					source: outHTML,
					type: 'asset',
				});
			}
		},
	};
}

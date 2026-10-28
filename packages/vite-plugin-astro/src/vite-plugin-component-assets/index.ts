import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prependForwardSlash } from '@astrojs/internal-helpers/path';
import {
	type DevEnvironment,
	isRunnableDevEnvironment,
	type Plugin,
	type ResolvedConfig,
	type Rolldown,
	type ViteBuilder,
} from 'vite';
import { PROPAGATED_ASSET_FLAG } from '@astrojs/runtime/internal/core/head-propagation/boundary.js';
import {
	buildImporterGraphFromModuleInfo,
	computeInTreeAncestors,
} from '@astrojs/runtime/internal/core/head-propagation/graph.js';
import { CSS_LANGS_RE, normalizePath } from '../core/vite-id.js';
import type { AstroRenderer, SSRComponentMetadata } from '@astrojs/runtime/types';
import { getAstroMetadata } from '../vite-plugin-astro/metadata.js';
import type { PluginMetadata } from '../vite-plugin-astro/types.js';
import {
	collectCSSWithOrder,
	ensureModulesLoaded,
	inlineRE,
	isBuildableCSSRequest,
	rawRE,
} from '../vite-plugin-css/collect.js';
import { RESOLVED_ASTRO_RENDERERS_MODULE_ID } from '../vite-plugin-renderers/const.js';
import type { ComponentAssets, ComponentAssetsManifest } from './types.js';

export type { ComponentAssets, ComponentAssetsManifest } from './types.js';

export const COMPONENT_ASSETS_MODULE_ID = 'virtual:astro:component-assets';
const RESOLVED_COMPONENT_ASSETS_MODULE_ID = `\0${COMPONENT_ASSETS_MODULE_ID}`;
/** Dev only: one module per component, `virtual:astro:component-assets/<encodeModuleId(id)>`. */
const DEV_ASSETS_PREFIX = `${COMPONENT_ASSETS_MODULE_ID}/`;
const RESOLVED_DEV_ASSETS_PREFIX = `\0${DEV_ASSETS_PREFIX}`;
/** Build only: client entry that imports the stylesheets of one component tree. */
const COMPONENT_CSS_PREFIX = 'virtual:astro:component-css/';
const RESOLVED_COMPONENT_CSS_PREFIX = `\0${COMPONENT_CSS_PREFIX}`;
/** Build only: placeholder client entry used when the project has no client input of its own. */
const EMPTY_CLIENT_ENTRY_ID = 'virtual:astro:client-entry';
const RESOLVED_EMPTY_CLIENT_ENTRY_ID = `\0${EMPTY_CLIENT_ENTRY_ID}`;
/** Replaced with the JSON manifest in the server output once the client build has finished. */
const MANIFEST_PLACEHOLDER = '__ASTRO_COMPONENT_ASSETS_MANIFEST__';
/**
 * Marks a style request as unscoped so Vite does not tree-shake it from the client build, where
 * the component that owns it is never imported.
 */
const UNSCOPED_STYLE_QUERY = 'astroUnscoped';

const BEFORE_HYDRATION_SCRIPT_ID = 'astro:scripts/before-hydration.js';

export interface ComponentAssetsPluginOptions {
	renderers: readonly AstroRenderer[];
	/** Project settings the render API reads, exported as `renderConfig`. */
	getRenderConfig: () => { compressHTML: boolean | 'jsx'; site: string | undefined };
}

/** What the server build learned about one component tree. */
interface ServerComponentInfo {
	cssIds: string[];
	componentMetadata: [string, SSRComponentMetadata][];
}

/**
 * Collects the stylesheets, scripts and island URLs each `.astro` component tree needs and serves
 * them to the render API through `virtual:astro:component-assets`.
 *
 * - Dev: assets are collected from the server environment's module graph on request.
 * - Build: the server environments are built first; their module graphs decide the client build
 *   entries (stylesheets, hydrated components, scripts, renderer client entrypoints). After the
 *   client build, the resulting URLs are written into the server output as a manifest.
 */
export default function vitePluginComponentAssets({
	renderers,
	getRenderConfig,
}: ComponentAssetsPluginOptions): Plugin {
	let viteConfig: ResolvedConfig;
	let userRoot = process.cwd();
	const cssContentCache = new Map<string, string>();

	const serverComponents = new Map<string, ServerComponentInfo>();
	/** Client build entries: the specifier `result.resolve()` receives, mapped to the id to build. */
	const clientEntries = new Map<string, string>();
	const serverFilesWithPlaceholder = new Set<string>();
	let manifest: ComponentAssetsManifest = { components: {}, resolve: {} };
	const clientEntryRefs = new Map<string, string>(); // specifier -> emitted chunk ref

	function toDevUrl(id: string): string {
		const root = normalizePath(viteConfig.root) + '/';
		const base = viteConfig.base.replace(/\/$/, '');
		const normalized = normalizePath(id);
		if (normalized.startsWith(root)) return base + '/' + normalized.slice(root.length);
		if (path.isAbsolute(id)) return base + '/@fs' + prependForwardSlash(normalized);
		return base + '/@id/' + id;
	}

	return {
		name: 'astro:component-assets',
		config(userConfig, env) {
			if (env.command !== 'build') return;
			userRoot = path.resolve(userConfig.root ?? '');
			// Build every environment through `buildApp` so the client build can be planned from the
			// server build.
			return { builder: {} };
		},
		configEnvironment(name, options, env) {
			if (env.command !== 'build') return;
			const consumer = options.consumer ?? (name === 'client' ? 'client' : 'server');
			if (consumer !== 'client') return;
			const build = options.build ?? {};
			const input = build.rolldownOptions?.input ?? build.rollupOptions?.input;
			// Keep Vite's default `index.html` input when the project has one.
			if (input || existsSync(path.join(userRoot, 'index.html'))) return;
			return {
				build: {
					rolldownOptions: { input: { 'astro-client': EMPTY_CLIENT_ENTRY_ID } },
				},
			};
		},
		configResolved(config) {
			viteConfig = config;
		},

		async buildApp(builder: ViteBuilder) {
			for (const environment of Object.values(builder.environments)) {
				if (environment.config.consumer !== 'server' || environment.isBuilt) continue;
				const build = environment.config.build;
				if (typeof build.ssr !== 'string' && !build.rolldownOptions.input) continue;
				await builder.build(environment);
			}
			const client = builder.environments.client;
			if (client && !client.isBuilt) {
				await builder.build(client);
			}
			const json = JSON.stringify(manifest);
			for (const file of serverFilesWithPlaceholder) {
				const code = await fs.readFile(file, 'utf-8');
				await fs.writeFile(
					file,
					code
						.replaceAll(`"${MANIFEST_PLACEHOLDER}"`, json)
						.replaceAll(`'${MANIFEST_PLACEHOLDER}'`, json),
				);
			}
		},

		resolveId: {
			filter: {
				id: new RegExp(
					`^(${COMPONENT_ASSETS_MODULE_ID}|${COMPONENT_CSS_PREFIX}|${EMPTY_CLIENT_ENTRY_ID})`,
				),
			},
			handler(id) {
				return `\0${id}`;
			},
		},

		load: {
			filter: {
				id: new RegExp(
					`^(${RESOLVED_COMPONENT_ASSETS_MODULE_ID}|${RESOLVED_COMPONENT_CSS_PREFIX}|${RESOLVED_EMPTY_CLIENT_ENTRY_ID})`,
				),
			},
			async handler(id) {
				if (id === RESOLVED_EMPTY_CLIENT_ENTRY_ID) {
					return { code: '' };
				}
				if (id.startsWith(RESOLVED_COMPONENT_CSS_PREFIX)) {
					const moduleId = decodeURIComponent(id.slice(RESOLVED_COMPONENT_CSS_PREFIX.length));
					const cssIds = serverComponents.get(moduleId)?.cssIds ?? [];
					return {
						code: cssIds.map((cssId) => `import ${JSON.stringify(toUnscoped(cssId))};`).join('\n'),
					};
				}
				if (id === RESOLVED_COMPONENT_ASSETS_MODULE_ID) {
					const renderConfig = `export const renderConfig = ${JSON.stringify(getRenderConfig())};\n`;
					if (viteConfig.command === 'build') {
						return {
							code: `${renderConfig}const manifest = ${JSON.stringify(MANIFEST_PLACEHOLDER)};
const empty = { styles: [], resolve: {}, componentMetadata: [] };
export async function getComponentAssets(moduleId) {
	const assets = manifest.components[moduleId] ?? empty;
	return { ...assets, resolve: { ...manifest.resolve, ...assets.resolve } };
}`,
						};
					}
					return {
						code: `${renderConfig}export async function getComponentAssets(moduleId) {
	// The module runner treats bare ids as externals; the /@id/ prefix routes them to plugins.
	const mod = await import(/* @vite-ignore */ ${JSON.stringify('/@id/' + DEV_ASSETS_PREFIX)} + encodeURIComponent(moduleId).replaceAll('.', '%2E'));
	return mod.default;
}`,
					};
				}
				// Dev: one component tree.
				const moduleId = decodeURIComponent(id.slice(RESOLVED_DEV_ASSETS_PREFIX.length));
				const env = this.environment as DevEnvironment;
				const assets: ComponentAssets = { styles: [], resolve: {}, componentMetadata: [] };
				await env.fetchModule(moduleId).catch(() => {});
				const resolvedId = env.moduleGraph.getModuleById(moduleId)
					? moduleId
					: (await env.pluginContainer.resolveId(moduleId))?.id;
				const mod = resolvedId ? env.moduleGraph.getModuleById(resolvedId) : undefined;
				if (mod?.id) {
					await ensureModulesLoaded(env, mod, { isBoundary: isRenderersModule });
					for (const style of collectCSSWithOrder(mod.id, mod, { isBoundary: isRenderersModule })) {
						assets.styles.push({
							type: 'inline',
							content: cssContentCache.get(style.idKey) ?? '',
							viteDevId: style.id,
						});
					}
					const tree = new Set<string>();
					walkDevGraph(mod, tree);
					for (const treeId of tree) {
						const info = this.getModuleInfo(treeId);
						const astro = info ? getAstroMetadata(info) : undefined;
						if (!astro) continue;
						assets.componentMetadata.push([
							treeId,
							{ containsHead: astro.containsHead, propagation: astro.propagation },
						]);
						for (const specifier of getClientSpecifiers(treeId, astro)) {
							assets.resolve[specifier] = toDevUrl(specifier);
						}
					}
				}
				for (const renderer of renderers) {
					if (!renderer.clientEntrypoint) continue;
					const entryId = entrypointToId(renderer.clientEntrypoint);
					const resolved = await this.resolve(entryId);
					assets.resolve[rendererSpecifier(renderer.clientEntrypoint)] = toDevUrl(
						resolved?.id ?? entryId,
					);
				}
				assets.resolve[BEFORE_HYDRATION_SCRIPT_ID] = '';
				return { code: `export default ${JSON.stringify(assets)};` };
			},
		},

		transform: {
			filter: {
				id: { include: [CSS_LANGS_RE], exclude: [rawRE, inlineRE] },
			},
			handler(code, id) {
				if (viteConfig.command === 'serve' && this.environment.config.consumer === 'server') {
					cssContentCache.set(id, code);
				}
			},
		},

		hotUpdate: {
			order: 'pre',
			handler() {
				if (this.environment.config.consumer !== 'server') return;
				// Any change can alter a component tree's stylesheets or islands: re-collect on next render.
				for (const [moduleId, mod] of this.environment.moduleGraph.idToModuleMap) {
					if (!moduleId.startsWith(RESOLVED_DEV_ASSETS_PREFIX)) continue;
					this.environment.moduleGraph.invalidateModule(mod);
					if (isRunnableDevEnvironment(this.environment)) {
						const runnerModule = this.environment.runner.evaluatedModules.getModuleById(moduleId);
						if (runnerModule) {
							this.environment.runner.evaluatedModules.invalidateModule(runnerModule);
						}
					}
				}
			},
		},

		buildStart() {
			if (viteConfig.command !== 'build' || this.environment.config.consumer !== 'client') return;
			for (const [moduleId, info] of serverComponents) {
				if (!info.cssIds.length) continue;
				this.emitFile({
					type: 'chunk',
					id: COMPONENT_CSS_PREFIX + encodeModuleId(moduleId),
					name: path.basename(moduleId).replace(/\.astro$/, ''),
				});
			}
			for (const [specifier, entryId] of clientEntries) {
				clientEntryRefs.set(
					specifier,
					this.emitFile({ type: 'chunk', id: entryId, preserveSignature: 'exports-only' }),
				);
			}
		},

		generateBundle(_options, bundle) {
			if (viteConfig.command !== 'build') return;
			if (this.environment.config.consumer === 'server') {
				collectServerBuild.call(this, bundle);
				return;
			}
			if (this.environment.config.consumer !== 'client') return;
			const base = viteConfig.base;
			manifest = { components: {}, resolve: { [BEFORE_HYDRATION_SCRIPT_ID]: '' } };
			// Chunks are looked up by facade id: emitted chunks that share a `name` can share a reference id.
			const cssEntries = new Map<string, Rolldown.OutputChunk>();
			for (const [fileName, output] of Object.entries(bundle)) {
				if (output.type !== 'chunk' || !output.facadeModuleId) continue;
				if (output.facadeModuleId === RESOLVED_EMPTY_CLIENT_ENTRY_ID) {
					delete bundle[fileName];
				} else if (output.facadeModuleId.startsWith(RESOLVED_COMPONENT_CSS_PREFIX)) {
					cssEntries.set(
						decodeURIComponent(output.facadeModuleId.slice(RESOLVED_COMPONENT_CSS_PREFIX.length)),
						output,
					);
				}
			}
			for (const [specifier, ref] of clientEntryRefs) {
				manifest.resolve[specifier] = base + this.getFileName(ref);
			}
			for (const [moduleId, info] of serverComponents) {
				const styles: ComponentAssets['styles'] = [];
				const chunk = cssEntries.get(moduleId);
				if (chunk) {
					for (const css of collectChunkCss(bundle, chunk)) {
						styles.push({ type: 'external', src: base + css });
					}
				}
				manifest.components[moduleId] = {
					styles,
					resolve: {},
					componentMetadata: info.componentMetadata,
				};
			}
			// These entries only exist to produce stylesheets.
			for (const chunk of cssEntries.values()) delete bundle[chunk.fileName];
		},
	};

	function collectServerBuild(this: Rolldown.PluginContext, bundle: Rolldown.OutputBundle) {
		const outDir = viteConfigOutDir(this);
		const moduleIds = new Set<string>();
		for (const output of Object.values(bundle)) {
			if (output.type !== 'chunk') continue;
			if (output.code.includes(MANIFEST_PLACEHOLDER)) {
				serverFilesWithPlaceholder.add(path.join(outDir, output.fileName));
			}
			for (const moduleId of output.moduleIds) moduleIds.add(moduleId);
		}

		// Components that render head content (`propagation: 'self'`) make every importer `in-tree`.
		const propagationSeeds = [...moduleIds].filter((id) => {
			if (id.includes(`?${PROPAGATED_ASSET_FLAG}`)) return true;
			const info = this.getModuleInfo(id);
			return info ? getAstroMetadata(info)?.propagation === 'self' : false;
		});
		const inTree = computeInTreeAncestors({
			seeds: propagationSeeds,
			importerGraph: buildImporterGraphFromModuleInfo(moduleIds, (id) => this.getModuleInfo(id)),
		});

		for (const moduleId of moduleIds) {
			const info = this.getModuleInfo(moduleId);
			if (!info || !getAstroMetadata(info)) continue;
			if (serverComponents.has(moduleId)) continue;
			const cssIds: string[] = [];
			const componentMetadata: [string, SSRComponentMetadata][] = [];
			let treeContainsHead = false;
			walkBuildGraph(this, moduleId, new Set(), (id, astro) => {
				if (isBuildableCSSRequest(id)) {
					cssIds.push(id);
				} else if (astro) {
					treeContainsHead ||= astro.containsHead;
					componentMetadata.push([
						id,
						{
							containsHead: astro.containsHead,
							propagation:
								astro.propagation === 'self' ? 'self' : inTree.has(id) ? 'in-tree' : 'none',
						},
					]);
					for (const specifier of getClientSpecifiers(id, astro)) {
						clientEntries.set(specifier, specifier);
					}
				}
			});
			// The root decides whether the render has a `<head>` anywhere in its tree.
			if (componentMetadata[0]) componentMetadata[0][1].containsHead = treeContainsHead;
			serverComponents.set(moduleId, { cssIds, componentMetadata });
		}
		for (const renderer of renderers) {
			if (renderer.clientEntrypoint) {
				clientEntries.set(
					rendererSpecifier(renderer.clientEntrypoint),
					entrypointToId(renderer.clientEntrypoint),
				);
			}
		}
	}

	function viteConfigOutDir(context: Rolldown.PluginContext): string {
		const environment = (context as unknown as { environment: { config: ResolvedConfig } })
			.environment;
		return path.resolve(environment.config.root, environment.config.build.outDir);
	}
}

/** Island and script specifiers a compiled component passes to `result.resolve()`. */
function getClientSpecifiers(moduleId: string, astro: PluginMetadata['astro']): string[] {
	const specifiers: string[] = [];
	for (const component of [...astro.hydratedComponents, ...astro.clientOnlyComponents]) {
		if (component.resolvedPath) specifiers.push(component.resolvedPath);
	}
	const filename = moduleId.split('?')[0];
	for (let index = 0; index < astro.scripts.length; index++) {
		specifiers.push(`${filename}?astro&type=script&index=${index}&lang.ts`);
	}
	return specifiers;
}

/**
 * Compiled components import the server code of every renderer through
 * `virtual:astro:render-setup`. It is no part of a component tree: a server entrypoint can reach
 * styles that belong only to the components it renders (Vue's `appEntrypoint`).
 */
function isRenderersModule(id: string): boolean {
	return id === RESOLVED_ASTRO_RENDERERS_MODULE_ID;
}

function walkDevGraph(mod: { id: string | null; importedModules: Set<any> }, seen: Set<string>) {
	if (!mod.id || seen.has(mod.id)) return;
	seen.add(mod.id);
	if (mod.id.includes(`?${PROPAGATED_ASSET_FLAG}`)) return;
	for (const imported of mod.importedModules) walkDevGraph(imported, seen);
}

/** Depth-first walk of the build module graph, in import order. */
function walkBuildGraph(
	context: Rolldown.PluginContext,
	id: string,
	seen: Set<string>,
	visit: (id: string, astro: PluginMetadata['astro'] | undefined) => void,
) {
	if (seen.has(id)) return;
	seen.add(id);
	if (id.includes(`?${PROPAGATED_ASSET_FLAG}`) || isRenderersModule(id)) return;
	const info = context.getModuleInfo(id);
	visit(id, info ? getAstroMetadata(info) : undefined);
	if (!info || isBuildableCSSRequest(id)) return;
	for (const imported of [...info.importedIds, ...info.dynamicallyImportedIds]) {
		walkBuildGraph(context, imported, seen, visit);
	}
}

/**
 * Encodes a module id into a virtual module id. Dots are encoded too, so the virtual id does not
 * end in a file extension (such as `.astro`) that other plugins transform.
 */
function encodeModuleId(moduleId: string): string {
	return encodeURIComponent(moduleId).replaceAll('.', '%2E');
}

/**
 * Stylesheets of a chunk and the chunks it statically imports. Stylesheets shared between entries
 * are split into the shared chunks, so the entry's own `importedCss` is not enough.
 */
function collectChunkCss(
	bundle: Rolldown.OutputBundle,
	chunk: Rolldown.OutputChunk,
	css = new Set<string>(),
	seen = new Set<string>(),
): Set<string> {
	if (seen.has(chunk.fileName)) return css;
	seen.add(chunk.fileName);
	for (const imported of chunk.imports) {
		const importedChunk = bundle[imported];
		if (importedChunk?.type === 'chunk') collectChunkCss(bundle, importedChunk, css, seen);
	}
	for (const file of chunk.viteMetadata?.importedCss ?? []) css.add(file);
	return css;
}

function toUnscoped(cssId: string): string {
	return cssId.replace('?astro&', `?astro&${UNSCOPED_STYLE_QUERY}&`);
}

/** The specifier the render runtime passes to `result.resolve()` for a renderer. */
function rendererSpecifier(entrypoint: string | URL): string {
	return decodeURI(entrypoint.toString());
}

function entrypointToId(entrypoint: string | URL): string {
	return typeof entrypoint === 'string' ? entrypoint : fileURLToPath(entrypoint);
}

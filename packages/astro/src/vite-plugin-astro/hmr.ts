import type { HmrContext, ModuleNode } from 'vite';
import type { AstroConfig } from '../@types/astro.js';
import type { cachedCompilation } from '../core/compile/index.js';
import type { RootNode, Node } from '@astrojs/compiler/types';
import { invalidateCompilation, isCached } from '../core/compile/index.js';
import type { Logger } from '../core/logger/core.js';
import { isAstroSrcFile } from '../core/logger/vite.js';
import { isAstroScript } from './query.js';
import { getCachedFileContent } from '../core/compile/cache.js';
import { parse } from '@astrojs/compiler';
import { serialize } from '@astrojs/compiler/utils';

export interface HandleHotUpdateOptions {
	config: AstroConfig;
	logger: Logger;

	compile: () => ReturnType<typeof cachedCompilation>;
	source: string;
}

export async function handleHotUpdate(
	ctx: HmrContext,
	{ config, logger, source: newSource, compile }: HandleHotUpdateOptions
) {
	let isStyleOnlyChange = false;
	if (ctx.file.endsWith('.astro')) {
		const { content: oldSource = '' } = getCachedFileContent(ctx.file) ?? {};
		// Skip HMR if source hasn't changed
		if (oldSource === newSource) return [];
		isStyleOnlyChange = await isStyleOnlyChanged(oldSource, newSource);
	}
	invalidateCompilation(config, ctx.file);

	// Skip monorepo files to avoid console spam
	if (isAstroSrcFile(ctx.file)) {
		return;
	}

	// go through each of these modules importers and invalidate any .astro compilation
	// that needs to be rerun.
	const filtered = new Set<ModuleNode>(ctx.modules);
	const files = new Set<string>();
	for (const mod of ctx.modules) {
		// Skip monorepo files to avoid console spam
		if (isAstroSrcFile(mod.id ?? mod.file)) {
			filtered.delete(mod);
			continue;
		}

		if (mod.file && isCached(config, mod.file)) {
			filtered.add(mod);
			files.add(mod.file);
		}

		for (const imp of mod.importers) {
			if (imp.file && isCached(config, imp.file)) {
				filtered.add(imp);
				files.add(imp.file);
			}
		}
	}

	// Invalidate happens as a separate step because a single .astro file
	// produces multiple CSS modules and we want to return all of those.
	for (const file of files) {
		invalidateCompilation(config, file);
		// If `ctx.file` is depended by an .astro file, e.g. via `this.addWatchFile`,
		// Vite doesn't trigger updating that .astro file by default. See:
		// https://github.com/vitejs/vite/issues/3216
		// For now, we trigger the change manually here.
		if (file.endsWith('.astro')) {
			ctx.server.moduleGraph.onFileChange(file);
		}
	}

	// Bugfix: sometimes style URLs get normalized and end with `lang.css=`
	// These will cause full reloads, so filter them out here
	let mods = [...filtered].filter((m) => !m.url.endsWith('='));
	if (isStyleOnlyChange) {
		logger.debug('watch', 'style-only change');
		// Since the module has been invalidated, we need to eagerly recompile it
		await compile();
		// Only return the Astro styles that have changed!
		mods = mods.filter((mod) => mod.id?.includes('astro&type=style'))
		return mods;
	}

	// Add hoisted scripts so these get invalidated
	for (const mod of mods) {
		for (const imp of mod.importedModules) {
			if (imp.id && isAstroScript(imp.id)) {
				mods.push(imp);
			}
		}
	}

	return mods;
}

async function isStyleOnlyChanged(oldSource: string, newSource: string) {
	const [oldResult, newResult] = await Promise.all([oldSource, newSource].map(source => tryParse(source)));
	if (oldResult && newResult) {
		const { ast: oldAST } = oldResult;
		const { ast: newAST } = newResult;
		if (oldAST.children.length !== newAST.children.length) return false;
		if (extractStyles(oldAST) !== extractStyles(newAST)) {
			if (serializeWithoutStyles(oldAST) !== serializeWithoutStyles(newAST)) return false;
			return true;
		}
	}
	return false;
}

async function tryParse(source: string) {
	try {
		const result = await parse(source, { position: false });
		return result;
	} catch {}
}

function extractStyles(ast: RootNode): string {
	const styles: string[] = [];
	walk(ast, (node) => {
		if (node.type === 'element' && node.name === 'style') {
			styles.push(serialize(node))
		}
	})
	return styles.join('\n');
}

function serializeWithoutStyles(ast: RootNode): string {
	walk(ast, (node) => {
		if (node.type === 'element' && node.name === 'style') {
			node.children = [];
			node.attributes = [];
		}
	})
	return serialize(ast);
}

function walk(node: Node, callback: (node: Node, i?: number, parent?: Node) => any, args: [i?: number, parent?: Node] = []) {
	callback(node, ...args);
	if ('children' in node) {
		let i = 0;
		for (const child of node.children) {
			walk(child, callback, [i++, node]);
		}
	}
}

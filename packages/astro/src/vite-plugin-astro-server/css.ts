import type { ModuleLoader, ModuleNode } from '../core/module-loader/index.js';
import { viteID } from '../core/util.js';
import { isBuildableCSSRequest } from './util.js';
import { crawlGraph } from './vite.js';
import type {AstroConfig} from "../@types/astro.js";

interface ImportedStyle {
	id: string;
	url: string;
	content: string;
}

/** Given a filePath URL, crawl Vite’s module graph to find all style imports. */
export async function getStylesForURL(
	filePath: URL,
	loader: ModuleLoader,
	config: AstroConfig,
): Promise<{ urls: Set<string>; styles: ImportedStyle[]; crawledFiles: Set<string> }> {
	const importedCssUrls = new Set<string>();
	// Map of url to injected style object. Use a `url` key to deduplicate styles
	const importedStylesMap = new Map<string, ImportedStyle>();
	const crawledFiles = new Set<string>();

	if (!config.build.mergeSpaStylesheets) {
		// Only serve the styles directly used in the requested endpoint.
		for await (const importedModule of crawlGraph(loader, viteID(filePath), true)) {
			await writeStylesForImportedModule(
				importedModule,
				importedCssUrls,
				importedStylesMap,
				crawledFiles,
				loader
			);
		}
	} else {
		// Serve all application styles, i.e. SPA-like.
		const moduleIds: string[] = [];
		loader.eachModule(m => {
			if (!m.id) {
				return;
			}
			moduleIds.push(m.id);
		});
		for (const moduleId of moduleIds) {
			const isRootFile = (
				moduleId.includes("/src/pages/") &&
				moduleId.endsWith(".astro")
			);
			for await (const importedModule of crawlGraph(loader, moduleId, isRootFile)) {
				await writeStylesForImportedModule(
					importedModule,
					importedCssUrls,
					importedStylesMap,
					crawledFiles,
					loader
				);
			}
		}
	}

	return {
		urls: importedCssUrls,
		styles: [...importedStylesMap.values()],
		crawledFiles,
	};
}

async function writeStylesForImportedModule(
	importedModule: ModuleNode,
	importedCssUrls: Set<string>,
	importedStylesMap: Map<string, ImportedStyle>,
	crawledFiles: Set<string>,
	loader: ModuleLoader,
) {
	if (importedModule.file) {
		crawledFiles.add(importedModule.file);
	}
	if (!isBuildableCSSRequest(importedModule.url)) {
		return;
	}
	// In dev, we inline all styles if possible
	let css = '';
	// If this is a plain CSS module, the default export should be a string
	if (typeof importedModule.ssrModule?.default === 'string') {
		css = importedModule.ssrModule.default;
	}
	// Else try to load it
	else {
		const url = new URL(importedModule.url, 'http://localhost');
		// Mark url with ?inline so Vite will return the CSS as plain string, even for CSS modules
		url.searchParams.set('inline', '');
		const modId = `${decodeURI(url.pathname)}${url.search}`;

		try {
			// The SSR module is possibly not loaded. Load it if it's null.
			const ssrModule = await loader.import(modId);
			css = ssrModule.default;
		} catch {
			// Some CSS modules, e.g. from Vue files, may not work with the ?inline query.
			// If so, we fallback to a url instead
			if (modId.includes('.module.')) {
				importedCssUrls.add(importedModule.url);
			}
			// The module may not be inline-able, e.g. SCSS partials. Skip it as it may already
			// be inlined into other modules if it happens to be in the graph.
			return;
		}
	}

	importedStylesMap.set(importedModule.url, {
		id: importedModule.id ?? importedModule.url,
		url: importedModule.url,
		content: css,
	});
}

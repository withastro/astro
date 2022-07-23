import type { ModuleNode, ViteDevServer } from 'vite';
import type { Metadata } from '../../runtime/server/metadata.js';

/** Check if a URL is already valid */
export function isValidURL(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch (e) {}
	return false;
}

// https://vitejs.dev/guide/features.html#css-pre-processors
export const STYLE_EXTENSIONS = new Set([
	'.css',
	'.pcss',
	'.postcss',
	'.scss',
	'.sass',
	'.styl',
	'.stylus',
	'.less',
]);

// duplicate const from vite-plugin-markdown
// can't import directly due to Deno bundling issue
// (node fs import failing during prod builds)
const MARKDOWN_IMPORT_FLAG = '?mdImport';

const cssRe = new RegExp(
	`\\.(${Array.from(STYLE_EXTENSIONS)
		.map((s) => s.slice(1))
		.join('|')})($|\\?)`
);
export const isCSSRequest = (request: string): boolean => cssRe.test(request);

// During prod builds, some modules have dependencies we should preload by hand
// Ex. markdown files imported asynchronously or via Astro.glob(...)
// This calls each md file's $$loadMetadata to discover those dependencies
// and writes all results to the input `metadata` object
const seenMdMetadata = new Set<string>();
export async function collectMdMetadata(
	metadata: Metadata,
	modGraph: ModuleNode,
	viteServer: ViteDevServer
) {
	const importedModules = [...(modGraph?.importedModules ?? [])];
	await Promise.all(
		importedModules.map(async (importedModule) => {
			// recursively check for importedModules
			if (!importedModule.id || seenMdMetadata.has(importedModule.id)) return;

			seenMdMetadata.add(importedModule.id);
			await collectMdMetadata(metadata, importedModule, viteServer);

			if (!importedModule?.id?.endsWith(MARKDOWN_IMPORT_FLAG)) return;

			const mdSSRMod = await viteServer.ssrLoadModule(importedModule.id);
			const mdMetadata = (await mdSSRMod.$$loadMetadata?.()) as Metadata;
			if (!mdMetadata) return;

			for (let mdMod of mdMetadata.modules) {
				mdMod.specifier = mdMetadata.resolvePath(mdMod.specifier);
				metadata.modules.push(mdMod);
			}
			for (let mdHoisted of mdMetadata.hoisted) {
				metadata.hoisted.push(mdHoisted);
			}
			for (let mdHydrated of mdMetadata.hydratedComponents) {
				metadata.hydratedComponents.push(mdHydrated);
			}
			for (let mdClientOnly of mdMetadata.clientOnlyComponents) {
				metadata.clientOnlyComponents.push(mdClientOnly);
			}
			for (let mdHydrationDirective of mdMetadata.hydrationDirectives) {
				metadata.hydrationDirectives.add(mdHydrationDirective);
			}
		})
	);
}

import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import type { Plugin } from 'vite';

// Matches `new URL('./file.wasm', import.meta.url)` patterns.
// Vite's built-in `assetImportMetaUrlPlugin` handles this for client environments,
// but skips SSR environments because Node.js can resolve `import.meta.url` natively.
// Cloudflare Workers can't resolve filesystem paths, so we need to emit the asset
// and rewrite the URL for the SSR environment too.
const assetImportMetaUrlRE =
	/\bnew\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*(?:,\s*)?\)/dg;

// File extensions that should be handled by this plugin.
// These are non-JS binary assets that Cloudflare Workers can't resolve via `import.meta.url`.
const ASSET_EXTENSIONS = new Set(['.wasm']);

function isAssetFile(url: string): boolean {
	const ext = path.extname(url.split('?')[0]);
	return ASSET_EXTENSIONS.has(ext);
}

/**
 * Vite plugin that handles `new URL('./file.wasm', import.meta.url)` patterns in
 * Cloudflare Worker (SSR) environments.
 *
 * In standard SSR builds, Vite's `assetImportMetaUrlPlugin` only runs for client
 * environments (`consumer === "client"`). This plugin replicates that behavior for
 * the SSR environment, ensuring that referenced assets are emitted and the URLs are
 * rewritten so the Worker can resolve them at runtime via Cloudflare's asset serving.
 */
export function createWasmUrlPlugin(): Plugin {
	return {
		name: '@astrojs/cloudflare:wasm-url',
		applyToEnvironment(environment) {
			return environment.name === 'ssr';
		},
		transform: {
			filter: {
				code: /new\s+URL.+import\.meta\.url/s,
			},
			async handler(code, id) {
				// Skip virtual modules
				if (id.startsWith('\0')) return;

				// Collect all replacements first, then apply them from right to left
				// to avoid offset issues
				const replacements: { start: number; end: number; replacement: string }[] = [];

				let match: RegExpExecArray | null;
				assetImportMetaUrlRE.lastIndex = 0;

				while ((match = assetImportMetaUrlRE.exec(code)) !== null) {
					const indices = match.indices!;
					const [startIndex, endIndex] = indices[0];
					const [urlStart, urlEnd] = indices[1];

					const rawUrl = code.slice(urlStart, urlEnd);

					// Skip template literals with dynamic expressions — these would need
					// import.meta.glob which is more complex and less common for WASM
					if (rawUrl[0] === '`' && rawUrl.includes('${')) continue;

					const url = rawUrl.slice(1, -1);

					// Only handle asset files (e.g., .wasm)
					if (!isAssetFile(url)) continue;

					// Skip data: URLs and absolute URLs
					if (url.startsWith('data:') || url.startsWith('http:') || url.startsWith('https:'))
						continue;

					// Resolve the file path relative to the module
					let file: string;
					if (url[0] === '.') {
						file = path.resolve(path.dirname(id), url);
					} else if (url[0] === '/') {
						// Absolute paths relative to root — skip for now
						continue;
					} else {
						continue;
					}

					// Try to read and emit the file
					let source: Buffer;
					try {
						source = readFileSync(file);
					} catch {
						// File not found — skip silently (Vite will warn)
						continue;
					}

					const referenceId = this.emitFile({
						type: 'asset',
						name: path.basename(file),
						originalFileName: path.relative(this.environment.config.root, file),
						source,
					});

					// Replace the whole `new URL(...)` expression with Vite's asset placeholder.
					// The existing Vite `vite:asset` plugin's `renderChunk` will replace
					// `__VITE_ASSET__<refId>__` with the correct asset path.
					const builtUrl = `__VITE_ASSET__${referenceId}__`;
					replacements.push({
						start: startIndex,
						end: endIndex,
						replacement: `new URL(${JSON.stringify(builtUrl)}, import.meta.url)`,
					});
				}

				if (replacements.length === 0) return;

				// Apply replacements from right to left to preserve indices
				let result = code;
				for (let i = replacements.length - 1; i >= 0; i--) {
					const { start, end, replacement } = replacements[i];
					result = result.slice(0, start) + replacement + result.slice(end);
				}

				return {
					code: result,
					map: null,
				};
			},
		},
	};
}

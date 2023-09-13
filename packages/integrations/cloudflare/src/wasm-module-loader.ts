import * as fs from 'node:fs';
import * as path from 'node:path';
import { type Plugin } from 'vite';

/**
 * Loads '*.wasm?module' imports as WebAssembly modules, which is the only way to load WASM in cloudflare workers.
 * Current proposal for WASM modules: https://github.com/WebAssembly/esm-integration/tree/main/proposals/esm-integration
 * Cloudflare worker WASM from javascript support: https://developers.cloudflare.com/workers/runtime-apis/webassembly/javascript/
 * @returns Vite plugin to load WASM tagged with '?module' as a WASM modules
 */
export function wasmModuleLoader(): Plugin {
	const postfix = '.wasm?module';
	let isDev = false;

	return {
		name: 'vite:wasm-module-loader',
		enforce: 'pre',
		configResolved(config) {
			isDev = config.command === 'serve';
		},
		config(_, __) {
			// let vite know that file format and the magic import string is intentional, and will be handled in this plugin
			return {
				assetsInclude: ['**/*.wasm?module'],
				build: { rollupOptions: { external: /^__WASM_ASSET__.+\.wasm$/i } },
			};
		},

		load(id, _) {
			if (!id.endsWith(postfix)) {
				return;
			}

			const filePath = id.slice(0, -1 * '?module'.length);
			if (isDev) {
				// when running in vite serve, do the file system reading dance
				return `
        import fs from "node:fs"
        const wasmModule = new WebAssembly.Module(fs.readFileSync("${filePath}"));
        export default wasmModule;
        `;
			} else {
				// build to just a re-export of the original asset contents
				const assetId = this.emitFile({
					type: 'asset',
					name: path.basename(filePath),
					source: fs.readFileSync(filePath),
				});

				// import from magic asset string to be replaced later
				return `
        import init from "__WASM_ASSET__${assetId}.wasm"
        export default init
        `;
			}
		},

		// output original wasm file relative to the chunk
		renderChunk(code, chunk, _) {
			if (isDev) return;

			if (!/__WASM_ASSET__([a-z\d]+)\.wasm/g.test(code)) return;

			const final = code.replaceAll(/__WASM_ASSET__([a-z\d]+)\.wasm/g, (s, assetId) => {
				const fileName = this.getFileName(assetId);
				const relativePath = path.relative(path.dirname(chunk.fileName), fileName);
				return `./${relativePath}`;
			});

			return { code: final };
		},
	};
}

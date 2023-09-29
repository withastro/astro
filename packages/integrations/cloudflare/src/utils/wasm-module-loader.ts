import * as fs from 'node:fs';
import * as path from 'node:path';
import { type Plugin } from 'vite';

/**
 * Loads '*.wasm?module' imports as WebAssembly modules, which is the only way to load WASM in cloudflare workers.
 * Current proposal for WASM modules: https://github.com/WebAssembly/esm-integration/tree/main/proposals/esm-integration
 * Cloudflare worker WASM from javascript support: https://developers.cloudflare.com/workers/runtime-apis/webassembly/javascript/
 * @param disabled - if true throws a helpful error message if wasm is encountered and wasm imports are not enabled,
 * 								otherwise it will error obscurely in the esbuild and vite builds
 * @param assetsDirectory - the folder name for the assets directory in the build directory. Usually '_astro'
 * @returns Vite plugin to load WASM tagged with '?module' as a WASM modules
 */
export function wasmModuleLoader({
	disabled,
	assetsDirectory,
}: {
	disabled: boolean;
	assetsDirectory: string;
}): Plugin {
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
				build: { rollupOptions: { external: /^__WASM_ASSET__.+\.wasm\.mjs$/i } },
			};
		},

		load(id, _) {
			if (!id.endsWith(postfix)) {
				return;
			}
			if (disabled) {
				throw new Error(
					`WASM module's cannot be loaded unless you add \`wasmModuleImports: true\` to your astro config.`
				);
			}

			const filePath = id.slice(0, -1 * '?module'.length);

			const data = fs.readFileSync(filePath);
			const base64 = data.toString('base64');

			const base64Module = `
const wasmModule = new WebAssembly.Module(Uint8Array.from(atob("${base64}"), c => c.charCodeAt(0)));
export default wasmModule
`;
			if (isDev) {
				// no need to wire up the assets in dev mode, just rewrite
				return base64Module;
			} else {
				// just some shared ID
				let hash = hashString(base64);
				// emit the wasm binary as an asset file, to be picked up later by the esbuild bundle for the worker.
				// give it a shared deterministic name to make things easy for esbuild to switch on later
				const assetName = path.basename(filePath).split('.')[0] + '.' + hash + '.wasm';
				this.emitFile({
					type: 'asset',
					// put it explicitly in the _astro assets directory with `fileName` rather than `name` so that
					// vite doesn't give it a random id in its name. We need to be able to easily rewrite from
					// the .mjs loader and the actual wasm asset later in the ESbuild for the worker
					fileName: path.join(assetsDirectory, assetName),
					source: fs.readFileSync(filePath),
				});

				// however, by default, the SSG generator cannot import the .wasm as a module, so embed as a base64 string
				const chunkId = this.emitFile({
					type: 'prebuilt-chunk',
					fileName: assetName + '.mjs',
					code: base64Module,
				});

				return `
import wasmModule from "__WASM_ASSET__${chunkId}.wasm.mjs";
export default wasmModule;
	`;
			}
		},

		// output original wasm file relative to the chunk
		renderChunk(code, chunk, _) {
			if (isDev) return;

			if (!/__WASM_ASSET__/g.test(code)) return;

			const final = code.replaceAll(/__WASM_ASSET__([a-z\d]+).wasm.mjs/g, (s, assetId) => {
				const fileName = this.getFileName(assetId);
				const relativePath = path
					.relative(path.dirname(chunk.fileName), fileName)
					.replaceAll('\\', '/'); // fix windows paths for import
				return `./${relativePath}`;
			});

			return { code: final };
		},
	};
}

/**
 * Returns a deterministic 32 bit hash code from a string
 */
function hashString(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash &= hash; // Convert to 32bit integer
	}
	return new Uint32Array([hash])[0].toString(36);
}

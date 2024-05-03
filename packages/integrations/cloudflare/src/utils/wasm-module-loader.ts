import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as url from 'node:url';
import type { AstroConfig } from 'astro';
import type { OutputBundle } from 'rollup';
import type { PluginOption } from 'vite';

export interface CloudflareModulePluginExtra {
	afterBuildCompleted(config: AstroConfig): Promise<void>;
}
/**
 * Enables support for wasm modules within cloudflare pages functions
 *
 * Loads '*.wasm?module' and `*.wasm` imports as WebAssembly modules, which is the only way to load WASM in cloudflare workers.
 * Current proposal for WASM modules: https://github.com/WebAssembly/esm-integration/tree/main/proposals/esm-integration
 * Cloudflare worker WASM from javascript support: https://developers.cloudflare.com/workers/runtime-apis/webassembly/javascript/
 * @param enabled - if true, load '.wasm' imports as Uint8Arrays, otherwise will throw errors when encountered to clarify that it must be enabled
 * @returns Vite plugin to load WASM tagged with '?module' as a WASM modules
 */
export function cloudflareModuleLoader(
	enabled: boolean
): PluginOption & CloudflareModulePluginExtra {
	const enabledAdapters = cloudflareImportAdapters.filter((x) => enabled);
	let isDev = false;
	const MAGIC_STRING = '__CLOUDFLARE_ASSET__';
	const replacements: Replacement[] = [];

	return {
		name: 'vite:wasm-module-loader',
		enforce: 'pre',
		configResolved(config) {
			isDev = config.command === 'serve';
		},
		config(_, __) {
			// let vite know that file format and the magic import string is intentional, and will be handled in this plugin
			return {
				assetsInclude: enabledAdapters.map((x) => `**/*.${x.qualifiedExtension}`),
				build: {
					rollupOptions: {
						// mark the wasm files as external so that they are not bundled and instead are loaded from the files
						external: enabledAdapters.map(
							(x) => new RegExp(`^${MAGIC_STRING}.+\\.${x.extension}.mjs$`, 'i')
						),
					},
				},
			};
		},

		async load(id, _) {
			const importAdapter = cloudflareImportAdapters.find((x) => id.endsWith(x.qualifiedExtension));
			if (!importAdapter) {
				return;
			}
			if (!enabled) {
				throw new Error(
					`Cloudflare module loading is experimental. The ${importAdapter.qualifiedExtension} module cannot be loaded unless you add \`wasmModuleImports: true\` to your astro config.`
				);
			}

			const filePath = id.replace(/\?module$/, '');

			const data = await fs.readFile(filePath);
			const base64 = data.toString('base64');

			const inlineModule = importAdapter.asNodeModule(data);

			if (isDev) {
				// no need to wire up the assets in dev mode, just rewrite
				return inlineModule;
			}
			// just some shared ID
			const hash = hashString(base64);
			// emit the wasm binary as an asset file, to be picked up later by the esbuild bundle for the worker.
			// give it a shared deterministic name to make things easy for esbuild to switch on later
			const assetName = `${path.basename(filePath).split('.')[0]}.${hash}.${
				importAdapter.extension
			}`;
			this.emitFile({
				type: 'asset',
				// emit the data explicitly as an esset with `fileName` rather than `name` so that
				// vite doesn't give it a random hash-id in its name--We need to be able to easily rewrite from
				// the .mjs loader and the actual wasm asset later in the ESbuild for the worker
				fileName: assetName,
				source: data,
			});

			// however, by default, the SSG generator cannot import the .wasm as a module, so embed as a base64 string
			const chunkId = this.emitFile({
				type: 'prebuilt-chunk',
				fileName: `${assetName}.mjs`,
				code: inlineModule,
			});

			return `import module from "${MAGIC_STRING}${chunkId}.${importAdapter.extension}.mjs";export default module;`;
		},

		// output original wasm file relative to the chunk now that chunking has been achieved
		renderChunk(code, chunk, _) {
			if (isDev) return;

			if (!code.includes(MAGIC_STRING)) return;

			// SSR will need the .mjs suffix removed from the import before this works in cloudflare, but this is done as a final step
			// so as to support prerendering from nodejs runtime
			let replaced = code;
			for (const loader of enabledAdapters) {
				replaced = replaced.replaceAll(
					// chunk id can be many things, (alpha numeric, dollars, or underscores, maybe more)
					new RegExp(`${MAGIC_STRING}([^\\s]+?)\\.${loader.extension}\\.mjs`, 'g'),
					(s, assetId) => {
						const fileName = this.getFileName(assetId);
						const relativePath = path
							.relative(path.dirname(chunk.fileName), fileName)
							.replaceAll('\\', '/'); // fix windows paths for import

						// record this replacement for later, to adjust it to import the unbundled asset
						replacements.push({
							chunkName: chunk.name,
							cloudflareImport: relativePath.replace(/\.mjs$/, ''),
							nodejsImport: relativePath,
						});
						return `./${relativePath}`;
					}
				);
			}
			if (replaced.includes(MAGIC_STRING)) {
				console.error('failed to replace', replaced);
			}

			return { code: replaced };
		},

		generateBundle(_, bundle: OutputBundle) {
			// associate the chunk name to the final file name. After the prerendering is done, we can use this to replace the imports in the _worker.js
			// in a targetted way
			const replacementsByChunkName = new Map<string, Replacement[]>();
			for (const replacement of replacements) {
				const repls = replacementsByChunkName.get(replacement.chunkName) || [];
				if (!repls.length) {
					replacementsByChunkName.set(replacement.chunkName, repls);
				}
				repls.push(replacement);
			}
			for (const chunk of Object.values(bundle)) {
				const repls = chunk.name && replacementsByChunkName.get(chunk.name);
				for (const replacement of repls || []) {
					replacement.fileName = chunk.fileName;
				}
			}
		},

		/**
		 * Once prerendering is complete, restore the imports in the _worker.js to cloudflare compatible ones, removing the .mjs suffix.
		 */
		async afterBuildCompleted(config: AstroConfig) {
			const baseDir = url.fileURLToPath(config.outDir);
			const replacementsByFileName = new Map<string, Replacement[]>();
			for (const replacement of replacements) {
				if (!replacement.fileName) continue;
				const repls = replacementsByFileName.get(replacement.fileName) || [];
				if (!repls.length) {
					replacementsByFileName.set(replacement.fileName, repls);
				}
				repls.push(replacement);
			}
			for (const [fileName, repls] of replacementsByFileName.entries()) {
				const filepath = path.join(baseDir, '_worker.js', fileName);
				const contents = await fs.readFile(filepath, 'utf-8');
				let updated = contents;
				for (const replacement of repls) {
					updated = contents.replaceAll(replacement.nodejsImport, replacement.cloudflareImport);
				}
				await fs.writeFile(filepath, updated, 'utf-8');
			}
		},
	};
}

export type ImportType = 'wasm';

interface Replacement {
	fileName?: string;
	chunkName: string;
	// desired import for cloudflare
	cloudflareImport: string;
	// nodejs import that simulates a wasm module
	nodejsImport: string;
}

interface ModuleImportAdapter {
	extension: ImportType;
	qualifiedExtension: string;
	asNodeModule(fileContents: Buffer): string;
}

const wasmImportAdapter: ModuleImportAdapter = {
	extension: 'wasm',
	qualifiedExtension: 'wasm?module',
	asNodeModule(fileContents: Buffer) {
		const base64 = fileContents.toString('base64');
		return `const wasmModule = new WebAssembly.Module(Uint8Array.from(atob("${base64}"), c => c.charCodeAt(0)));export default wasmModule;`;
	},
};

const cloudflareImportAdapters = [wasmImportAdapter];

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

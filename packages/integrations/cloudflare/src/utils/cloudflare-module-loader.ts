import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as url from 'node:url';
import type { AstroConfig } from 'astro';
import type { OutputBundle } from 'rollup';
import type { PluginOption } from 'vite';

export interface CloudflareModulePluginExtra {
	afterBuildCompleted(config: AstroConfig): Promise<void>;
}

type ModuleType = 'CompiledWasm' | 'Text' | 'Data';

/**
 * Enables support for various non-standard extensions in module imports that cloudflare workers supports.
 *
 * See https://developers.cloudflare.com/pages/functions/module-support/ for reference
 *
 * This adds supports for imports in the following formats:
 * - .wasm
 * - .wasm?module
 * - .bin
 * - .txt
 *
 * @param enabled - if true, will load all cloudflare pages supported types
 * @returns Vite plugin with additional extension method to hook into astro build
 */
export function cloudflareModuleLoader(
	enabled: boolean,
): PluginOption & CloudflareModulePluginExtra {
	/**
	 * It's likely that eventually cloudflare will add support for custom extensions, like they do in vanilla cloudflare workers,
	 * by adding rules to your wrangler.tome
	 * https://developers.cloudflare.com/workers/wrangler/bundling/
	 */
	const adaptersByExtension: Record<string, ModuleType> = enabled ? { ...defaultAdapters } : {};

	const extensions = Object.keys(adaptersByExtension);

	let isDev = false;
	const MAGIC_STRING = '__CLOUDFLARE_ASSET__';
	const replacements: Replacement[] = [];

	return {
		name: 'vite:cf-module-loader',
		enforce: 'pre',
		configResolved(config) {
			isDev = config.command === 'serve';
		},
		config(_, __) {
			// let vite know that file format and the magic import string is intentional, and will be handled in this plugin
			return {
				assetsInclude: extensions.map((x) => `**/*${x}`),
				build: {
					rollupOptions: {
						// mark the wasm files as external so that they are not bundled and instead are loaded from the files
						external: extensions.map(
							(x) => new RegExp(`^${MAGIC_STRING}.+${escapeRegExp(x)}.mjs$`, 'i'),
						),
					},
				},
			};
		},

		async load(id, _) {
			const maybeExtension = extensions.find((x) => id.endsWith(x));
			const moduleType: ModuleType | undefined =
				(maybeExtension && adaptersByExtension[maybeExtension]) || undefined;
			if (!moduleType || !maybeExtension) {
				return;
			}
			if (!enabled) {
				throw new Error(
					`Cloudflare module loading is experimental. The ${maybeExtension} module cannot be loaded unless you add \`cloudflareModules: true\` to your astro config.`,
				);
			}

			const moduleLoader = renderers[moduleType];

			const filePath = id.replace(/\?\w+$/, '');
			const extension = maybeExtension.replace(/\?\w+$/, '');

			const data = await fs.readFile(filePath);
			const base64 = data.toString('base64');

			const inlineModule = moduleLoader(data);

			if (isDev) {
				// no need to wire up the assets in dev mode, just rewrite
				return inlineModule;
			}
			// just some shared ID
			const hash = hashString(base64);
			// emit the wasm binary as an asset file, to be picked up later by the esbuild bundle for the worker.
			// give it a shared deterministic name to make things easy for esbuild to switch on later
			const assetName = `${path.basename(filePath).split('.')[0]}.${hash}${extension}`;
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

			return `import module from "${MAGIC_STRING}${chunkId}${extension}.mjs";export default module;`;
		},

		// output original wasm file relative to the chunk now that chunking has been achieved
		renderChunk(code, chunk, _) {
			if (isDev) return;

			if (!code.includes(MAGIC_STRING)) return;

			// SSR will need the .mjs suffix removed from the import before this works in cloudflare, but this is done as a final step
			// so as to support prerendering from nodejs runtime
			let replaced = code;
			for (const ext of extensions) {
				const extension = ext.replace(/\?\w+$/, '');
				// chunk id can be many things, (alpha numeric, dollars, or underscores, maybe more)
				replaced = replaced.replaceAll(
					new RegExp(`${MAGIC_STRING}([^\\s]+?)${escapeRegExp(extension)}\\.mjs`, 'g'),
					(_s, assetId) => {
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
					},
				);
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
					if (!replacement.fileName) {
						replacement.fileName = [] as string[];
					}
					replacement.fileName.push(chunk.fileName);
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
				if (!replacement.fileName) {
					continue;
				}
				for (const fileName of replacement.fileName) {
					const repls = replacementsByFileName.get(fileName) || [];
					if (!repls.length) {
						replacementsByFileName.set(fileName, repls);
					}
					repls.push(replacement);
				}
			}
			for (const [fileName, repls] of replacementsByFileName.entries()) {
				const filepath = path.join(baseDir, '_worker.js', fileName);
				const contents = await fs.readFile(filepath, 'utf-8');
				let updated = contents;
				for (const replacement of repls) {
					updated = updated.replaceAll(replacement.nodejsImport, replacement.cloudflareImport);
				}
				await fs.writeFile(filepath, updated, 'utf-8');
			}
		},
	};
}

interface Replacement {
	fileName?: string[];
	chunkName: string;
	// desired import for cloudflare
	cloudflareImport: string;
	// nodejs import that simulates a wasm module
	nodejsImport: string;
}

const renderers: Record<ModuleType, (fileContents: Buffer) => string> = {
	CompiledWasm(fileContents: Buffer) {
		const base64 = fileContents.toString('base64');
		return `const wasmModule = new WebAssembly.Module(Uint8Array.from(atob("${base64}"), c => c.charCodeAt(0)));export default wasmModule;`;
	},
	Data(fileContents: Buffer) {
		const base64 = fileContents.toString('base64');
		return `const binModule = Uint8Array.from(atob("${base64}"), c => c.charCodeAt(0)).buffer;export default binModule;`;
	},
	Text(fileContents: Buffer) {
		const escaped = JSON.stringify(fileContents.toString('utf-8'));
		return `const stringModule = ${escaped};export default stringModule;`;
	},
};

const defaultAdapters: Record<string, ModuleType> = {
	// Loads '*.wasm?module' imports as WebAssembly modules, which is the only way to load WASM in cloudflare workers.
	// Current proposal for WASM modules: https://github.com/WebAssembly/esm-integration/tree/main/proposals/esm-integration
	'.wasm?module': 'CompiledWasm',
	// treats the module as a WASM module
	'.wasm': 'CompiledWasm',
	'.bin': 'Data',
	'.txt': 'Text',
};

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

function escapeRegExp(string: string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

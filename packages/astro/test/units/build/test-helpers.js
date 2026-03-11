// @ts-check
import { fileURLToPath } from 'node:url';

/**
 * @param {object} options
 * @param {'static' | 'server'} options.buildOutput
 * @param {boolean} [options.preserveBuildClientDir]
 * @param {URL} [options.outDir]
 * @param {URL} [options.clientDir]
 * @param {'directory' | 'file' | 'preserve'} [options.buildFormat]
 */
export function createSettings({
	buildOutput,
	preserveBuildClientDir = false,
	outDir = new URL('file:///project/dist/'),
	clientDir = new URL('file:///project/dist/client/'),
	buildFormat = 'directory',
}) {
	return {
		buildOutput,
		adapter: preserveBuildClientDir
			? { adapterFeatures: { preserveBuildClientDir: true } }
			: undefined,
		config: {
			outDir,
			build: {
				client: clientDir,
				format: buildFormat,
			},
		},
	};
}

/**
 * A Vite plugin that provides in-memory .astro source files as virtual modules.
 * This allows running a full Astro build without any files on disk.
 *
 * @param {URL} root - The project root URL
 * @param {Record<string, string>} files - Map of relative paths (e.g. 'src/pages/index.astro') to source content
 */
export function virtualAstroModules(root, files) {
	const virtualFiles = new Map();
	for (const [relativePath, source] of Object.entries(files)) {
		const absolute = fileURLToPath(new URL(relativePath, root));
		virtualFiles.set(absolute, source);
	}

	return {
		name: 'virtual-astro-modules',
		enforce: 'pre',
		resolveId: {
			handler(id, importer) {
				// Handle absolute paths (used by server island manifest dynamic imports)
				if (virtualFiles.has(id)) {
					return id;
				}
				// Handle bare paths like "/src/pages/index.astro"
				if (id.startsWith('/')) {
					const absolute = fileURLToPath(new URL('.' + id, root));
					if (virtualFiles.has(absolute)) {
						return absolute;
					}
				}
				// Handle relative imports from within virtual files
				if (importer && virtualFiles.has(importer) && id.startsWith('.')) {
					const resolved = fileURLToPath(new URL(id, 'file://' + importer));
					if (virtualFiles.has(resolved)) {
						return resolved;
					}
				}
			},
		},
		load: {
			handler(id) {
				if (virtualFiles.has(id)) {
					return { code: virtualFiles.get(id) };
				}
			},
		},
	};
}

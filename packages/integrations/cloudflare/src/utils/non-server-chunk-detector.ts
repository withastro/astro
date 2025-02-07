import type { OutputBundle } from 'rollup';
import type { PluginOption } from 'vite';

/**
 * A Vite bundle analyzer that identifies chunks that are not used for server rendering.
 *
 * The chunks injected by Astro for prerendering are flagged as non-server chunks.
 * Any chunks that is only used by a non-server chunk are also flagged as non-server chunks.
 * This continues transitively until all non-server chunks are found.
 */
export class NonServerChunkDetector {
	private nonServerChunks?: string[];

	public getPlugin(): PluginOption {
		return {
			name: 'non-server-chunk-detector',
			generateBundle: (_, bundle) => {
				// Skip if we bundle for client
				if (!bundle['index.js']) return;
				this.processBundle(bundle);
			},
		};
	}

	private processBundle(bundle: OutputBundle) {
		const chunkNamesToFiles = new Map<string, string>();

		const entryChunks: string[] = [];
		const chunkToDependencies = new Map<string, string[]>();

		for (const chunk of Object.values(bundle)) {
			if (chunk.type !== 'chunk') continue;

			// Construct a mapping from a chunk name to its file name
			chunkNamesToFiles.set(chunk.name, chunk.fileName);
			// Construct a mapping from a chunk file to all the modules it imports
			chunkToDependencies.set(chunk.fileName, [...chunk.imports, ...chunk.dynamicImports]);

			if (chunk.isEntry) {
				// Entry chunks should always be kept around since they are to be imported by the runtime
				entryChunks.push(chunk.fileName);
			}
		}

		const chunkDecisions = new Map<string, boolean>();

		for (const entry of entryChunks) {
			// Entry chunks are used on the server
			chunkDecisions.set(entry, true);
		}

		for (const chunk of ['prerender', 'prerender@_@astro']) {
			// Prerender chunks are not used on the server
			const fileName = chunkNamesToFiles.get(chunk);
			if (fileName) {
				chunkDecisions.set(fileName, false);
			}
		}

		// Start a stack of chunks that are used on the server
		const chunksToWalk = [...entryChunks];

		// Iterate over the chunks, traversing the transitive dependencies of the chunks used on the server
		for (let chunk = chunksToWalk.pop(); chunk; chunk = chunksToWalk.pop()) {
			for (const dep of chunkToDependencies.get(chunk) ?? []) {
				// Skip dependencies already flagged, dependencies may be repeated and/or circular
				if (chunkDecisions.has(dep)) continue;

				// A dependency of a module used on the server is also used on the server
				chunkDecisions.set(dep, true);
				// Add the dependency to the stack so its own dependencies are also flagged
				chunksToWalk.push(dep);
			}
		}

		// Any chunk not flagged as used on the server is a non-server chunk
		this.nonServerChunks = Array.from(chunkToDependencies.keys()).filter(
			(chunk) => !chunkDecisions.get(chunk),
		);
	}

	public getNonServerChunks(): string[] {
		return this.nonServerChunks ?? [];
	}
}

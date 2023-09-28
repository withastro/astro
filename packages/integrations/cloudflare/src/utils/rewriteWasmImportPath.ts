import esbuild from 'esbuild';
import { basename } from 'node:path';

/**
 *
 * @param relativePathToAssets - relative path from the final location for the current esbuild output bundle, to the assets directory.
 */
export function rewriteWasmImportPath({
	relativePathToAssets,
}: {
	relativePathToAssets: string;
}): esbuild.Plugin {
	return {
		name: 'wasm-loader',
		setup(build) {
			build.onResolve({ filter: /.*\.wasm.mjs$/ }, (args) => {
				const updatedPath = [
					relativePathToAssets.replaceAll('\\', '/'),
					basename(args.path).replace(/\.mjs$/, ''),
				].join('/');

				return {
					path: updatedPath,
					external: true, // mark it as external in the bundle
				};
			});
		},
	};
}

import type esbuild from 'esbuild';

export function patchSharpBundle(): esbuild.Plugin {
	return {
		name: 'sharp-patch',
		setup(build) {
			build.onResolve({ filter: /^sharp/ }, (args) => ({
				path: args.path,
				namespace: 'sharp-ns',
			}));

			build.onLoad({ filter: /.*/, namespace: 'sharp-ns' }, (a) => {
				return {
					contents: JSON.stringify(''),
					loader: 'json',
				};
			});
		},
	};
}

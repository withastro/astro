import type { Plugin } from 'esbuild';

export type RewriteResolutionOption = {
	filter: RegExp;
	rewrite: (path: string) => string;
};

export function esbuildRewritePlugin(rewrites: RewriteResolutionOption[]): Plugin {
	return {
		name: 'resolutionRewrite',
		setup(build) {
			for (const rewrite of rewrites) {
				build.onResolve({ filter: rewrite.filter }, async ({ path, ...options }) => {
					// avoid endless loops (this function will be called again by resolve())
					if (options.pluginData === 'skip-rewrite') {
						return undefined; // continue with original resolution
					}
					// get original resolution
					const resolution = await build.resolve(path, { ...options, pluginData: 'skip-rewrite' });
					resolution.path = rewrite.rewrite(resolution.path);
					return resolution;
				});
			}
		},
	};
}

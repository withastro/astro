import { createRequire } from 'node:module';
import { AstroError, AstroErrorData } from '@astrojs/runtime/_internal/core/errors/index.js';
import type * as vite from 'vite';

function isEsbuildResolvable(): boolean {
	try {
		// Vite imports esbuild from its own location, so resolve it from there.
		createRequire(import.meta.resolve('vite')).resolve('esbuild');
		return true;
	} catch {
		return false;
	}
}

/**
 * Throws `MissingEsbuild` when `build.cssMinify` or `build.minify` is set to `'esbuild'`
 * but `esbuild` cannot be resolved. Vite lists esbuild as an optional peer dependency
 * and otherwise fails with a bare module resolution error mid-build.
 * See https://github.com/withastro/astro/issues/18774
 */
export function pluginEsbuildCheck(canResolveEsbuild = isEsbuildResolvable): vite.Plugin {
	return {
		name: 'astro:esbuild-check',
		buildStart() {
			const { build } = this.environment.config;
			const option =
				build.cssMinify === 'esbuild'
					? 'build.cssMinify'
					: build.minify === 'esbuild'
						? 'build.minify'
						: undefined;
			if (option && !canResolveEsbuild()) {
				throw new AstroError({
					...AstroErrorData.MissingEsbuild,
					message: AstroErrorData.MissingEsbuild.message(option),
				});
			}
		},
	};
}

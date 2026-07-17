import { transform } from 'esbuild';
import type { Plugin } from 'vite';

// Matches @ followed by an identifier character — a minimal signal that
// the file *might* contain decorator syntax.  Combined with the `class`
// keyword check this keeps false-positive esbuild invocations low while
// avoiding expensive parsing.
const DECORATOR_RE = /@[\w$]/;

/**
 * Vite plugin that lowers TC39 standard (non-legacy) decorators.
 *
 * Rolldown / oxc (Vite 8) strips TypeScript syntax but does **not** lower
 * TC39 decorators at any target level.  This plugin detects TypeScript files
 * that likely contain decorator syntax and pre-processes them with esbuild
 * (`target: "es2024"`), which *does* lower TC39 decorators.
 *
 * The plugin runs with `enforce: "pre"` so the code has already been
 * lowered by the time Vite's built-in oxc transform sees it.
 */
export function vitePluginDecorators(): Plugin {
	return {
		name: 'astro:decorators',
		enforce: 'pre',
		async transform(code, id) {
			const [filepath] = id.split('?');

			// Only TypeScript files can contain decorators that need lowering.
			if (!/\.[cm]?tsx?$/.test(filepath)) return;
			// Skip declaration files – they never execute.
			if (/\.d\.[cm]?ts$/.test(filepath)) return;

			// Fast bail-out: no `@` or no `class` → definitely no decorators.
			if (!DECORATOR_RE.test(code) || !/\bclass\b/.test(code)) return;

			const loader: 'ts' | 'tsx' = /tsx?$/.test(filepath) && filepath.endsWith('x') ? 'tsx' : 'ts';

			const result = await transform(code, {
				loader,
				// es2024 is the highest target at which esbuild still lowers
				// TC39 decorators (esnext keeps them as-is).
				target: 'es2024',
				sourcemap: true,
				sourcefile: filepath,
			});

			return {
				code: result.code,
				map: result.map || null,
			};
		},
	};
}

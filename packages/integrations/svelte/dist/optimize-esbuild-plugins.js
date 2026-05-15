import { readFileSync } from 'node:fs';
function createSvelteOptimizeEsbuildPlugins(generate) {
	let svelteCompilerPromise;
	function loadCompiler() {
		svelteCompilerPromise ??= import('svelte/compiler');
		return svelteCompilerPromise;
	}
	const svelteComponentPlugin = {
		name: 'astrojs-svelte:optimize-component',
		setup(build) {
			if (build.initialOptions.plugins?.some((plugin) => plugin.name === 'vite:dep-scan')) {
				return;
			}
			build.onLoad({ filter: /\.svelte(?:\?.*)?$/ }, async ({ path: filename }) => {
				const code = readFileSync(filename, 'utf8');
				try {
					const compiler = await loadCompiler();
					const compiled = compiler.compile(code, {
						dev: true,
						filename,
						generate,
						css: 'injected',
					});
					const result = compiled.js;
					const contents = result.map
						? `${result.code}//# sourceMappingURL=${result.map.toUrl()}`
						: result.code;
					return { contents };
				} catch (error) {
					const text = error instanceof Error ? error.message : String(error);
					const position =
						typeof error === 'object' && error !== null && 'position' in error
							? error.position
							: void 0;
					return {
						errors: [
							{
								text,
								location: position
									? { file: filename, line: position.line, column: position.column }
									: void 0,
							},
						],
					};
				}
			});
		},
	};
	const svelteModulePlugin = {
		name: 'astrojs-svelte:optimize-module',
		setup(build) {
			if (build.initialOptions.plugins?.some((plugin) => plugin.name === 'vite:dep-scan')) {
				return;
			}
			build.onLoad({ filter: /\.svelte\.[jt]s(?:\?.*)?$/ }, async ({ path: filename }) => {
				const code = readFileSync(filename, 'utf8');
				try {
					const compiler = await loadCompiler();
					const compiled = compiler.compileModule(code, {
						dev: true,
						filename,
						generate,
					});
					const result = compiled.js;
					const contents = result.map
						? `${result.code}//# sourceMappingURL=${result.map.toUrl()}`
						: result.code;
					return { contents };
				} catch (error) {
					const text = error instanceof Error ? error.message : String(error);
					const position =
						typeof error === 'object' && error !== null && 'position' in error
							? error.position
							: void 0;
					return {
						errors: [
							{
								text,
								location: position
									? { file: filename, line: position.line, column: position.column }
									: void 0,
							},
						],
					};
				}
			});
		},
	};
	return [svelteComponentPlugin, svelteModulePlugin];
}
export { createSvelteOptimizeEsbuildPlugins };

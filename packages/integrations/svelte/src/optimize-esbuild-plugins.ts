import { readFileSync } from 'node:fs';
import type { DepOptimizationOptions } from 'vite';

type OptimizeDepsEsbuildPlugins = NonNullable<
	NonNullable<DepOptimizationOptions['esbuildOptions']>['plugins']
>;

export function createSvelteOptimizeEsbuildPlugins(
	generate: 'server' | 'client',
): OptimizeDepsEsbuildPlugins {
	let svelteCompilerPromise: Promise<typeof import('svelte/compiler')> | undefined;

	function loadCompiler() {
		svelteCompilerPromise ??= import('svelte/compiler');
		return svelteCompilerPromise;
	}

	const svelteComponentPlugin = {
		name: 'astrojs-svelte:optimize-component',
		setup(build: any) {
			if (build.initialOptions.plugins?.some((plugin: any) => plugin.name === 'vite:dep-scan')) {
				return;
			}

			build.onLoad(
				{ filter: /\.svelte(?:\?.*)?$/ },
				async ({ path: filename }: { path: string }) => {
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
								? (error.position as { line: number; column: number } | undefined)
								: undefined;

						return {
							errors: [
								{
									text,
									location: position
										? { file: filename, line: position.line, column: position.column }
										: undefined,
								},
							],
						};
					}
				},
			);
		},
	};

	const svelteModulePlugin = {
		name: 'astrojs-svelte:optimize-module',
		setup(build: any) {
			if (build.initialOptions.plugins?.some((plugin: any) => plugin.name === 'vite:dep-scan')) {
				return;
			}

			build.onLoad(
				{ filter: /\.svelte\.[jt]s(?:\?.*)?$/ },
				async ({ path: filename }: { path: string }) => {
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
								? (error.position as { line: number; column: number } | undefined)
								: undefined;

						return {
							errors: [
								{
									text,
									location: position
										? { file: filename, line: position.line, column: position.column }
										: undefined,
								},
							],
						};
					}
				},
			);
		},
	};

	return [svelteComponentPlugin, svelteModulePlugin];
}

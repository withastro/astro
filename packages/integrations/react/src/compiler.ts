import type { BabelOptions, Options } from '@vitejs/plugin-react';
import type { ReactCompilerOptions } from 'oxc-transform-react';
import { createFilter, type Plugin } from 'vite';
import { getReactMajorVersion } from './version.js';

export type CompilerOptions = ReactCompilerOptions;

function checkBabelOptions(options: BabelOptions): BabelOptions {
	for (const plugin of options.plugins ?? []) {
		if (Array.isArray(plugin) && plugin[1] === false) continue;
		const entry = Array.isArray(plugin) ? plugin[0] : plugin;
		const name = typeof entry === 'string' ? entry : typeof entry === 'function' ? entry.name : '';
		if (name.includes('babel-plugin-react-compiler') || name === 'BabelPluginReactCompiler') {
			throw new Error(
				'Enable only one React Compiler: remove babel-plugin-react-compiler or disable the @astrojs/react compiler option.',
			);
		}
	}
	for (const override of options.overrides ?? []) checkBabelOptions(override);
	for (const env of Object.values(options.env ?? {})) {
		if (env) checkBabelOptions(env);
	}
	return options;
}

export function withCompilerCheck(babel: Options['babel']): Options['babel'] {
	if (typeof babel === 'function') {
		return (id, options) => {
			const result = babel(id, options);
			return options.ssr ? result : checkBabelOptions(result);
		};
	}
	return babel && checkBabelOptions(babel);
}

export function reactCompilerPlugin(
	options: true | CompilerOptions,
	{ include, exclude }: Pick<Options, 'include' | 'exclude'>,
): Plugin {
	const compilerOptions: CompilerOptions = {
		target: String(getReactMajorVersion()) as '17' | '18' | '19',
		...(options === true ? {} : options),
	};
	const filter = createFilter(include ?? /\.[jt]sx?$/, exclude);
	let compiler: typeof import('oxc-transform-react');

	return {
		name: '@astrojs/react:compiler',
		enforce: 'pre',
		async config() {
			try {
				compiler = await import('oxc-transform-react');
			} catch (error) {
				this.error(
					`Could not load oxc-transform-react. Install it to use the @astrojs/react compiler option.\n${error instanceof Error ? error.message : String(error)}`,
				);
			}
			return {
				optimizeDeps: {
					include: [
						compilerOptions.target === '19' ? 'react/compiler-runtime' : 'react-compiler-runtime',
					],
				},
			};
		},
		async transform(code, id, transformOptions) {
			const filename = id.split('?')[0];
			if (
				transformOptions?.ssr ||
				this.environment.config.consumer === 'server' ||
				filename.includes('/node_modules/') ||
				!filter(filename)
			)
				return;
			const result = await compiler.transform(filename, code, {
				jsx: 'preserve',
				reactCompiler: compilerOptions,
				sourcemap: true,
			});
			if (result.fatal) {
				this.error(
					result.errors.map((error) => error.codeframe ?? error.message).join('\n') ||
						'React Compiler transform failed.',
				);
			}
			return { code: result.code, map: result.map };
		},
	};
}

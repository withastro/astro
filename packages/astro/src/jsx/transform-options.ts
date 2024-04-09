import type { JSXTransformConfig } from '../@types/astro.js';

export async function jsxTransformOptions(): Promise<JSXTransformConfig> {
	// @ts-expect-error types not found
	const plugin = await import('@babel/plugin-transform-react-jsx');
	const jsx = plugin.default?.default ?? plugin.default;
	const { default: astroJSX } = await import('./babel.js');
	return {
		plugins: [
			astroJSX(),
			jsx({}, { throwIfNamespace: false, runtime: 'automatic', importSource: 'astro' }),
		],
	};
}

import { ESBuildTransformResult, transformWithEsbuild } from 'vite';
import { cachedCompilation, CompileProps } from '../core/compile';
import { CompileResult } from '../core/compile/compile';
import { getFileInfo } from '../vite-plugin-utils';

interface FullCompileResult extends Omit<CompileResult, 'map'> {
	map: ESBuildTransformResult['map'];
}

export async function cachedFullCompilation(
	compileProps: CompileProps,
	rawId: string
): Promise<FullCompileResult> {
	const transformResult = await cachedCompilation(compileProps);
	const { fileId: file, fileUrl: url } = getFileInfo(rawId, compileProps.astroConfig);

	// Compile all TypeScript to JavaScript.
	// Also, catches invalid JS/TS in the compiled output before returning.
	const { code, map } = await transformWithEsbuild(transformResult.code, rawId, {
		loader: 'ts',
		sourcemap: 'external',
	});

	let SUFFIX = '';
	SUFFIX += `\nconst $$file = ${JSON.stringify(file)};\nconst $$url = ${JSON.stringify(
		url
	)};export { $$file as file, $$url as url };\n`;

	// Add HMR handling in dev mode.
	if (!compileProps.viteConfig.isProduction) {
		let i = 0;
		while (i < transformResult.scripts.length) {
			SUFFIX += `import "${rawId}?astro&type=script&index=${i}&lang.ts";`;
			i++;
		}
	}

	// Prefer live reload to HMR in `.astro` files
	if (!compileProps.viteConfig.isProduction) {
		SUFFIX += `\nif (import.meta.hot) { import.meta.hot.decline() }`;
	}

	return { ...transformResult, code, map };
}

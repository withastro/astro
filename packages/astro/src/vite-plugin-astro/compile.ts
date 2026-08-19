import type { Rolldown } from 'vite';
import { init, parse } from 'es-module-lexer';
import { type CompileProps, type CompileResult, compile } from '../core/compile/index.js';
import { getFileInfo } from '../vite-plugin-utils/index.js';
import type { CompileMetadata } from './types.js';

interface CompileAstroOption {
	compileProps: CompileProps;
	astroFileToCompileMetadata: Map<string, CompileMetadata>;
}

export interface CompileAstroResult extends Omit<CompileResult, 'map'> {
	map: Rolldown.SourceMapInput;
}

export async function compileAstro({
	compileProps,
	astroFileToCompileMetadata,
}: CompileAstroOption): Promise<CompileAstroResult> {
	const transformResult = await compile(compileProps);

	const { fileId: file, fileUrl: url } = getFileInfo(
		compileProps.filename,
		compileProps.astroConfig,
	);

	let SUFFIX = '';
	SUFFIX += `\nconst $$file = ${JSON.stringify(file)};\nconst $$url = ${JSON.stringify(
		url,
	)};export { $$file as file, $$url as url };\n`;
	await init;
	const [, exports] = parse(transformResult.code);
	const defaultExport = exports.find((entry) => entry.n === 'default');
	const componentName =
		defaultExport?.ln ??
		(defaultExport
			? /^\s*([$A-Z_a-z][$\w]*)/.exec(transformResult.code.slice(defaultExport.e))?.[1]
			: undefined);
	if (componentName) {
		const scripts = transformResult.scripts.map(
			(_, index) => `${compileProps.filename}?astro&type=script&index=${index}&lang.ts`,
		);
		SUFFIX += `import { setComponentAssets as $$setComponentAssets } from "astro/compiler-runtime";\n$$setComponentAssets(${componentName}, ${JSON.stringify({ styles: transformResult.css.map((style) => style.code), scripts })});\n`;
	}

	// Add HMR handling in dev mode.
	if (!compileProps.viteConfig.isProduction) {
		let i = 0;
		while (i < transformResult.scripts.length) {
			SUFFIX += `import "${compileProps.filename}?astro&type=script&index=${i}&lang.ts";`;
			i++;
		}
	}

	// Attach compile metadata to map for use by virtual modules
	astroFileToCompileMetadata.set(compileProps.filename, {
		originalCode: compileProps.source,
		css: transformResult.css,
		scripts: transformResult.scripts,
	});

	return {
		...transformResult,
		code: transformResult.code + SUFFIX,
		map: transformResult.map || null,
	};
}

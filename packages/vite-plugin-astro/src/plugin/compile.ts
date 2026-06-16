import type { Rolldown } from 'vite';
import { type CompileProps, type CompileResult, compile } from '../compile/index.js';
import { getFileInfo } from '../utils/getFileInfo.js';
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

	if (!compileProps.viteConfig.isProduction) {
		let i = 0;
		while (i < transformResult.scripts.length) {
			SUFFIX += `import "${compileProps.filename}?astro&type=script&index=${i}&lang.ts";`;
			i++;
		}
	}

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

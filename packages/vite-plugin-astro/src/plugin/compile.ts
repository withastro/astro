import type { Rolldown } from 'vite';
import { type CompileProps, type CompileResult, compile } from '../compile/index.js';
import type { CompileMetadata } from './types.js';
import type { Transform } from '../types.js';

interface CompileAstroOption {
	compileProps: CompileProps;
	astroFileToCompileMetadata: Map<string, CompileMetadata>;
	transform: Transform | undefined;
}

export interface CompileAstroResult extends Omit<CompileResult, 'map'> {
	map: Rolldown.SourceMapInput;
}

export async function compileAstro({
	compileProps,
	astroFileToCompileMetadata,
	transform,
}: CompileAstroOption): Promise<CompileAstroResult> {
	const transformResult = await compile(compileProps);

	let code = transformResult.code;

	if (transform) {
		code = transform(compileProps.filename, code);
	}

	let SUFFIX = '';

	// Add HMR handling in dev mode.
	if (!compileProps.viteConfig.isProduction) {
		let i = 0;
		while (i < transformResult.scripts.length) {
			SUFFIX += `import "${compileProps.filename}?astro&type=script&index=${i}&lang.ts";`;
			i++;
		}
	}

	code += SUFFIX;

	// Attach compile metadata to map for use by virtual modules
	astroFileToCompileMetadata.set(compileProps.filename, {
		originalCode: compileProps.source,
		css: transformResult.css,
		scripts: transformResult.scripts,
	});

	return {
		...transformResult,
		code,
		map: transformResult.map || null,
	};
}

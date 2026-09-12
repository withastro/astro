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
	let code = transformResult.code;

	const { fileId: file, fileUrl: url } = getFileInfo(
		compileProps.filename,
		compileProps.astroConfig,
	);

	let SUFFIX = '';
	SUFFIX += `\nconst $$file = ${JSON.stringify(file)};\nconst $$url = ${JSON.stringify(
		url,
	)};export { $$file as file, $$url as url };\n`;
	await init;
	const [imports, exports] = parse(code);
	const defaultExport = exports.find((entry) => entry.n === 'default');
	const componentName =
		defaultExport?.ln ??
		(defaultExport ? /^\s*([$A-Z_a-z][$\w]*)/.exec(code.slice(defaultExport.e))?.[1] : undefined);
	if (componentName) {
		const declaration = `const ${componentName} = `;
		const declarationStart = code.indexOf(declaration);
		const initializerStart = declarationStart + declaration.length;
		const initializerEnd = code.lastIndexOf(';', defaultExport!.s);
		const runtimeImport = imports.find((entry) => entry.n === 'astro/compiler-runtime');
		const importEnd = runtimeImport ? code.indexOf('}', runtimeImport.ss) : -1;
		if (
			declarationStart !== -1 &&
			initializerEnd !== -1 &&
			runtimeImport &&
			importEnd !== -1 &&
			importEnd < runtimeImport.s
		) {
			const scripts = transformResult.scripts.map(
				(_, index) => `${compileProps.filename}?astro&type=script&index=${index}&lang.ts`,
			);
			const assets = JSON.stringify({
				styles: transformResult.css.map((style) => style.code),
				scripts,
			});
			code =
				code.slice(0, initializerStart) +
				`/* @__PURE__ */ $$setComponentAssets(${code.slice(initializerStart, initializerEnd)}, ${assets})` +
				code.slice(initializerEnd);
			code =
				code.slice(0, importEnd) +
				', setComponentAssets as $$setComponentAssets' +
				code.slice(importEnd);
		}
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
		code: code + SUFFIX,
		map: transformResult.map || null,
	};
}

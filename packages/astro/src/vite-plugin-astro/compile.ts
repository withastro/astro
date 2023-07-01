import { transformWithEsbuild, type ESBuildTransformResult } from 'vite';
import type { AstroConfig } from '../@types/astro';
import { cachedCompilation, type CompileProps, type CompileResult } from '../core/compile/index.js';
import type { LogOptions } from '../core/logger/core.js';
import { getFileInfo } from '../vite-plugin-utils/index.js';

interface CachedFullCompilation {
	compileProps: CompileProps;
	logging: LogOptions;
}

interface FullCompileResult extends Omit<CompileResult, 'map'> {
	map: ESBuildTransformResult['map'];
}

interface EnhanceCompilerErrorOptions {
	err: Error;
	id: string;
	source: string;
	config: AstroConfig;
	logging: LogOptions;
}

const FRONTMATTER_PARSE_REGEXP = /^\-\-\-(.*)^\-\-\-/ms;

export async function cachedFullCompilation({
	compileProps,
	logging,
}: CachedFullCompilation): Promise<FullCompileResult> {
	let transformResult: CompileResult;
	let esbuildResult: ESBuildTransformResult;

	try {
		transformResult = await cachedCompilation(compileProps);
		// Compile all TypeScript to JavaScript.
		// Also, catches invalid JS/TS in the compiled output before returning.
		esbuildResult = await transformWithEsbuild(transformResult.code, compileProps.filename, {
			loader: 'ts',
			target: 'esnext',
			sourcemap: 'external',
			tsconfigRaw: {
				compilerOptions: {
					// Ensure client:only imports are treeshaken
					// @ts-expect-error anticipate esbuild 0.18 feature
					verbatimModuleSyntax: false,
					importsNotUsedAsValues: 'remove',
				},
			},
		});
	} catch (err: any) {
		await enhanceCompileError({
			err,
			id: compileProps.filename,
			source: compileProps.source,
			config: compileProps.astroConfig,
			logging: logging,
		});
		throw err;
	}

	const { fileId: file, fileUrl: url } = getFileInfo(
		compileProps.filename,
		compileProps.astroConfig
	);

	let SUFFIX = '';
	SUFFIX += `\nconst $$file = ${JSON.stringify(file)};\nconst $$url = ${JSON.stringify(
		url
	)};export { $$file as file, $$url as url };\n`;

	// Add HMR handling in dev mode.
	if (!compileProps.viteConfig.isProduction) {
		let i = 0;
		while (i < transformResult.scripts.length) {
			SUFFIX += `import "${compileProps.filename}?astro&type=script&index=${i}&lang.ts";`;
			i++;
		}
	}

	// Prefer live reload to HMR in `.astro` files
	if (!compileProps.viteConfig.isProduction) {
		SUFFIX += `\nif (import.meta.hot) { import.meta.hot.decline() }`;
	}

	return {
		...transformResult,
		code: esbuildResult.code + SUFFIX,
		map: esbuildResult.map,
	};
}

async function enhanceCompileError({
	err,
	id,
	source,
}: EnhanceCompilerErrorOptions): Promise<void> {
	const lineText = (err as any).loc?.lineText;
	// Verify frontmatter: a common reason that this plugin fails is that
	// the user provided invalid JS/TS in the component frontmatter.
	// If the frontmatter is invalid, the `err` object may be a compiler
	// panic or some other vague/confusing compiled error message.
	//
	// Before throwing, it is better to verify the frontmatter here, and
	// let esbuild throw a more specific exception if the code is invalid.
	// If frontmatter is valid or cannot be parsed, then continue.
	const scannedFrontmatter = FRONTMATTER_PARSE_REGEXP.exec(source);
	if (scannedFrontmatter) {
		// Top-level return is not supported, so replace `return` with throw
		const frontmatter = scannedFrontmatter[1].replace(/\breturn\b/g, 'throw');

		// If frontmatter does not actually include the offending line, skip
		if (lineText && !frontmatter.includes(lineText)) throw err;

		try {
			await transformWithEsbuild(frontmatter, id, {
				loader: 'ts',
				target: 'esnext',
				sourcemap: false,
			});
		} catch (frontmatterErr: any) {
			// Improve the error by replacing the phrase "unexpected end of file"
			// with "unexpected end of frontmatter" in the esbuild error message.
			if (frontmatterErr?.message) {
				frontmatterErr.message = frontmatterErr.message.replace(
					'end of file',
					'end of frontmatter'
				);
			}
			throw frontmatterErr;
		}
	}

	throw err;
}

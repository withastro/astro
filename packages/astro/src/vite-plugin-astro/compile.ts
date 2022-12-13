import { fileURLToPath } from 'url';
import { ESBuildTransformResult, transformWithEsbuild } from 'vite';
import { AstroConfig } from '../@types/astro';
import { cachedCompilation, CompileProps, CompileResult } from '../core/compile/index.js';
import { LogOptions } from '../core/logger/core.js';
import { getFileInfo } from '../vite-plugin-utils/index.js';

interface CachedFullCompilation {
	compileProps: CompileProps;
	rawId: string;
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
	rawId,
	logging,
}: CachedFullCompilation): Promise<FullCompileResult> {
	let transformResult: CompileResult;
	let esbuildResult: ESBuildTransformResult;

	try {
		transformResult = await cachedCompilation(compileProps);
		// Compile all TypeScript to JavaScript.
		// Also, catches invalid JS/TS in the compiled output before returning.
		esbuildResult = await transformWithEsbuild(transformResult.code, rawId, {
			loader: 'ts',
			target: 'esnext',
			sourcemap: 'external',
		});
	} catch (err: any) {
		await enhanceCompileError({
			err,
			id: rawId,
			source: compileProps.source,
			config: compileProps.astroConfig,
			logging: logging,
		});
		throw err;
	}

	const { fileId: file, fileUrl: url } = getFileInfo(rawId, compileProps.astroConfig);

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
	config,
	logging,
}: EnhanceCompilerErrorOptions): Promise<never> {
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
		try {
			await transformWithEsbuild(scannedFrontmatter[1], id, {
				loader: 'ts',
				target: 'esnext',
				sourcemap: false,
			});
		} catch (frontmatterErr: any) {
			// Improve the error by replacing the phrase "unexpected end of file"
			// with "unexpected end of frontmatter" in the esbuild error message.
			if (frontmatterErr && frontmatterErr.message) {
				frontmatterErr.message = frontmatterErr.message.replace(
					'end of file',
					'end of frontmatter'
				);
			}
			throw frontmatterErr;
		}
	}

	// improve compiler errors
	if (err.stack && err.stack.includes('wasm-function')) {
		const search = new URLSearchParams({
			labels: 'compiler',
			title: '🐛 BUG: `@astrojs/compiler` panic',
			template: '---01-bug-report.yml',
			'bug-description': `\`@astrojs/compiler\` encountered an unrecoverable error when compiling the following file.

**${id.replace(fileURLToPath(config.root), '')}**
\`\`\`astro
${source}
\`\`\``,
		});
		(err as any).url = `https://github.com/withastro/astro/issues/new?${search.toString()}`;
		err.message = `Error: Uh oh, the Astro compiler encountered an unrecoverable error!

    Please open
    a GitHub issue using the link below:
    ${(err as any).url}`;

		if (logging.level !== 'debug') {
			// TODO: remove stack replacement when compiler throws better errors
			err.stack = `    at ${id}`;
		}
	}

	throw err;
}

import { transformWithEsbuild } from 'vite';
import { compile } from '../core/compile/index.js';
import { getFileInfo } from '../vite-plugin-utils/index.js';
import { frontmatterRE, replaceTopLevelReturns } from './utils.js';
async function compileAstro({ compileProps, astroFileToCompileMetadata, logger }) {
	let transformResult;
	let esbuildResult;
	try {
		transformResult = await compile(compileProps);
		esbuildResult = await transformWithEsbuild(transformResult.code, compileProps.filename, {
			...compileProps.viteConfig.esbuild,
			loader: 'ts',
			sourcemap: 'external',
			tsconfigRaw: {
				compilerOptions: {
					// Ensure client:only imports are treeshaken
					verbatimModuleSyntax: false,
					importsNotUsedAsValues: 'remove',
				},
			},
		});
	} catch (err) {
		await enhanceCompileError({
			err,
			id: compileProps.filename,
			source: compileProps.source,
			config: compileProps.astroConfig,
			logger,
		});
		throw err;
	}
	const { fileId: file, fileUrl: url } = getFileInfo(
		compileProps.filename,
		compileProps.astroConfig,
	);
	let SUFFIX = '';
	SUFFIX += `
const $$file = ${JSON.stringify(file)};
const $$url = ${JSON.stringify(url)};export { $$file as file, $$url as url };
`;
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
		code: esbuildResult.code + SUFFIX,
		map: esbuildResult.map,
	};
}
async function enhanceCompileError({ err, id, source }) {
	const lineText = err.loc?.lineText;
	const scannedFrontmatter = frontmatterRE.exec(source);
	if (scannedFrontmatter) {
		const frontmatter = replaceTopLevelReturns(scannedFrontmatter[1]);
		if (lineText && !frontmatter.includes(lineText)) throw err;
		try {
			await transformWithEsbuild(frontmatter, id, {
				loader: 'ts',
				target: 'esnext',
				sourcemap: false,
			});
		} catch (frontmatterErr) {
			if (frontmatterErr?.message) {
				frontmatterErr.message = frontmatterErr.message.replace(
					'end of file',
					'end of frontmatter',
				);
			}
			throw frontmatterErr;
		}
	}
	throw err;
}
export { compileAstro };

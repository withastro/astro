import { compile } from '../core/compile/compile-rs.js';
import { getFileInfo } from '../vite-plugin-utils/index.js';
async function compileAstro({ compileProps, astroFileToCompileMetadata }) {
	const transformResult = await compile(compileProps);
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
		code: transformResult.code + SUFFIX,
		map: transformResult.map || null,
	};
}
export { compileAstro };

import { readFile } from 'node:fs/promises';
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;
const RETURN_REPLACE_RE =
	/(\/\/[^\n]*|\/\*[\s\S]*?\*\/|`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(?<!\.)\breturn(\s*;|\b)/g;
function replaceTopLevelReturns(code) {
	return code.replace(RETURN_REPLACE_RE, (_match, skip, tail) => {
		if (skip !== void 0) return skip;
		return tail.trim() === ';' ? 'throw 0;' : 'throw ';
	});
}
function astroFrontmatterScanPlugin() {
	return {
		name: 'astro-frontmatter-scan',
		setup(build) {
			build.onLoad({ filter: /\.astro$/, namespace: 'file' }, async (args) => {
				try {
					const code = await readFile(args.path, 'utf-8');
					const frontmatterMatch = FRONTMATTER_RE.exec(code);
					if (frontmatterMatch) {
						const contents = replaceTopLevelReturns(frontmatterMatch[1]);
						return {
							contents: contents + '\nexport default {}',
							loader: 'ts',
						};
					}
				} catch {}
				return {
					contents: 'export default {}',
					loader: 'ts',
				};
			});
		},
	};
}
export { astroFrontmatterScanPlugin };

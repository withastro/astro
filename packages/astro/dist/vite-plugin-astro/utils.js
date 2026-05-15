import fs from 'node:fs/promises';
const frontmatterRE = /^---(.*?)^---/ms;
const RETURN_REPLACE_RE =
	/(\/\/[^\n]*|\/\*[\s\S]*?\*\/|`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(?<!\.)\breturn(\s*;|\b)/g;
function replaceTopLevelReturns(code) {
	return code.replace(RETURN_REPLACE_RE, (_match, skip, tail) => {
		if (skip !== void 0) return skip;
		return tail.trim() === ';' ? 'throw 0;' : 'throw ';
	});
}
async function loadId(pluginContainer, id) {
	const result = await pluginContainer.load(id, { ssr: true });
	if (result) {
		if (typeof result === 'string') {
			return result;
		} else {
			return result.code;
		}
	}
	try {
		return await fs.readFile(id, 'utf-8');
	} catch {}
}
export { frontmatterRE, loadId, replaceTopLevelReturns };

import fs from 'node:fs/promises';
import type { PluginContainer } from 'vite';

export const frontmatterRE = /^---(.*?)^---/ms;

// Matches tokens to skip (strings, template literals, comments) OR a top-level `return`.
// The first alternative is preserved as-is; only the second is rewritten.
// Negative lookbehind `(?<!\.)` prevents matching member accesses like `gen.return()`.
const RETURN_REPLACE_RE =
	/(\/\/[^\n]*|\/\*[\s\S]*?\*\/|`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(?<!\.)\breturn(\s*;|\b)/g;

export function replaceTopLevelReturns(code: string): string {
	return code.replace(RETURN_REPLACE_RE, (_match, skip: string | undefined, tail: string) => {
		if (skip !== undefined) return skip;
		return tail.trim() === ';' ? 'throw 0;' : 'throw ';
	});
}

export async function loadId(pluginContainer: PluginContainer, id: string) {
	const result = await pluginContainer.load(id, { ssr: true });

	if (result) {
		if (typeof result === 'string') {
			return result;
		} else {
			return result.code;
		}
	}

	// Fallback to reading from fs (Vite doesn't add this by default)
	try {
		return await fs.readFile(id, 'utf-8');
	} catch {}
}

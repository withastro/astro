/**
 * When every `<style>` in a component is `is:global`, there is no scoped stylesheet, but
 * `@astrojs/compiler` may still inject `{ class: scope }` into `$$spreadAttributes(...)`.
 *
 * Prefer fixing this in `@astrojs/compiler`; keep this shim until WASM includes that fix so builds pass.
 *
 * @see https://github.com/withastro/astro/issues/16576
 */
export function shouldStripSpreadScopeArg(
	cssPartialCompileResults: { isGlobal: boolean }[],
): boolean {
	return (
		cssPartialCompileResults.length > 0 && cssPartialCompileResults.every((entry) => entry.isGlobal)
	);
}

/** Removes synthetic `$$spreadAttributes(first, undefined, { "class": "<scope>" })` tail when needed. */
export function stripIncorrectSpreadScopeClass(code: string): string {
	const open = '$$spreadAttributes(';
	let out = '';
	let pos = 0;

	while (pos < code.length) {
		const start = code.indexOf(open, pos);
		if (start === -1) {
			out += code.slice(pos);
			break;
		}
		out += code.slice(pos, start);
		const openParen = start + open.length - 1;
		const closeParen = findMatchingParen(code, openParen);
		if (closeParen === -1) {
			out += code.slice(start);
			break;
		}
		const inner = code.slice(openParen + 1, closeParen);
		const stripped = tryStripSpreadScopeSuffix(inner);
		if (stripped !== null) {
			out += `${open}${stripped})`;
		} else {
			out += code.slice(start, closeParen + 1);
		}
		pos = closeParen + 1;
	}

	return out;
}

/** Third argument from the compiler: `{ "class": "<scoped-hash>" }` */
const spreadScopeSuffix = /^([\s\S]*),\s*undefined\s*,\s*\{\s*"class"\s*:\s*"[^"]+"\s*\}$/;

function tryStripSpreadScopeSuffix(inner: string): string | null {
	const match = spreadScopeSuffix.exec(inner);
	return match?.[1] ?? null;
}

function findMatchingParen(code: string, openIdx: number): number {
	if (code.charAt(openIdx) !== '(') {
		return -1;
	}
	let depth = 0;
	let inString: '"' | "'" | '`' | null = null;
	let escaped = false;

	for (let i = openIdx; i < code.length; i++) {
		const ch = code[i];
		if (inString) {
			if (escaped) {
				escaped = false;
				continue;
			}
			if (ch === '\\' && inString !== '`') {
				escaped = true;
				continue;
			}
			if (ch === inString) {
				inString = null;
			}
			continue;
		}
		if (ch === '"' || ch === "'" || ch === '`') {
			inString = ch;
			continue;
		}
		if (ch === '(') {
			depth++;
		} else if (ch === ')') {
			depth--;
			if (depth === 0) {
				return i;
			}
		}
	}

	return -1;
}

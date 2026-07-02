/**
 * Post-processes compiler output to fix duplicate slot keys in object literals.
 *
 * `@astrojs/compiler-rs` may emit duplicate string keys in slot objects:
 *
 *   { "a": ($$result) => $$render`...`, "a": ($$result) => $$render`...` }
 *
 * JavaScript silently drops all but the last value for a given key, so only
 * the last element renders. This function detects those duplicates and merges
 * them into a single entry that renders all values in order.
 *
 * See: https://github.com/withastro/astro/issues/17266
 */
export function fixDuplicateSlotKeys(code: string): string {
	if (!code.includes('$$renderComponent')) return code;

	// Find each slots-object (last arg of $$renderComponent) and fix duplicates.
	// We search for `$$renderComponent(` and then locate the 5th argument.
	let result = '';
	let lastWritten = 0; // everything before this index has been written to result
	let searchFrom = 0;

	while (true) {
		const idx = code.indexOf('$$renderComponent(', searchFrom);
		if (idx === -1) break;

		const argsStart = idx + '$$renderComponent('.length;
		// Find the 5th argument (slots) by scanning commas at depth 0
		const argBounds = findArguments(code, argsStart);
		if (argBounds.length < 5) {
			// Not enough arguments, skip this call
			searchFrom = argsStart;
			continue;
		}

		const slotsStart = argBounds[4].start;
		const slotsEnd = argBounds[4].end;

		// Check if the 5th arg is an object literal
		const slotsContent = code.slice(slotsStart, slotsEnd);
		const trimmedSlots = slotsContent.trimStart();
		if (!trimmedSlots.startsWith('{')) {
			searchFrom = slotsEnd;
			continue;
		}

		// Parse object entries
		const objStart = slotsStart + (slotsContent.length - trimmedSlots.length);
		const entries = parseObjectEntries(code, objStart);
		if (!entries) {
			searchFrom = slotsEnd;
			continue;
		}

		// Check for duplicate keys
		const keySet = new Set<string>();
		let hasDuplicates = false;
		for (const entry of entries) {
			if (keySet.has(entry.key)) {
				hasDuplicates = true;
				break;
			}
			keySet.add(entry.key);
		}

		if (!hasDuplicates) {
			searchFrom = slotsEnd;
			continue;
		}

		// Merge duplicate entries
		const merged = new Map<string, string[]>();
		const keyOrder: string[] = [];
		for (const entry of entries) {
			if (!merged.has(entry.key)) {
				merged.set(entry.key, []);
				keyOrder.push(entry.key);
			}
			merged.get(entry.key)!.push(entry.value);
		}

		// Rebuild the object literal
		const rebuiltEntries: string[] = [];
		// The parameter name for the merged slot function (matching the compiler convention)
		const p = '\x24\x24result';
		for (const key of keyOrder) {
			const values = merged.get(key)!;
			if (values.length === 1) {
				rebuiltEntries.push(`${JSON.stringify(key)}: ${values[0]}`);
			} else {
				// Merge: create a slot function that renders all values as an array.
				// renderChild handles arrays by rendering each element in order.
				rebuiltEntries.push(
					`${JSON.stringify(key)}: (${p}) => [${values.map((v) => `(${v})(${p})`).join(', ')}]`,
				);
			}
		}

		const rebuiltObject = `{ ${rebuiltEntries.join(', ')} }`;
		const objectEnd = entries[entries.length - 1].objectEnd;

		// Replace the original object in the code
		result += code.slice(lastWritten, objStart) + rebuiltObject;
		lastWritten = objectEnd;
		searchFrom = objectEnd;
	}

	// If no modifications were made, return original code
	if (lastWritten === 0) return code;

	result += code.slice(lastWritten);
	return result;
}

interface ArgBound {
	start: number;
	end: number;
}

/**
 * Given the position right after `(`, finds the bounds of each argument.
 * Returns an array of {start, end} for each argument.
 */
function findArguments(code: string, start: number): ArgBound[] {
	const args: ArgBound[] = [];
	let i = skipWhitespace(code, start);
	if (i >= code.length || code[i] === ')') return args;

	let argStart = i;
	while (i < code.length) {
		const end = scanToCommaOrClose(code, i);
		args.push({ start: argStart, end });
		if (end >= code.length || code[end] === ')') break;
		// Skip comma
		i = skipWhitespace(code, end + 1);
		argStart = i;
	}
	return args;
}

interface ObjectEntry {
	key: string;
	value: string;
	objectEnd: number; // position after the closing `}`
}

/**
 * Parses entries of an object literal starting at `pos` (which should point to `{`).
 * Returns null if parsing fails.
 */
function parseObjectEntries(code: string, pos: number): ObjectEntry[] | null {
	if (code[pos] !== '{') return null;

	const entries: ObjectEntry[] = [];
	let i = pos + 1;
	i = skipWhitespace(code, i);

	while (i < code.length && code[i] !== '}') {
		// Parse key: "keyname"
		const keyResult = parseStringKey(code, i);
		if (!keyResult) return null;

		i = skipWhitespace(code, keyResult.end);
		// Expect `:`
		if (code[i] !== ':') return null;
		i = skipWhitespace(code, i + 1);

		// Parse value: scan to comma or closing `}`
		const valueEnd = scanToCommaOrCloseBrace(code, i);
		const value = code.slice(i, valueEnd).trim();

		entries.push({
			key: keyResult.key,
			value,
			objectEnd: -1, // will be set below
		});

		i = skipWhitespace(code, valueEnd);
		if (code[i] === ',') {
			i = skipWhitespace(code, i + 1);
		}
	}

	if (i < code.length && code[i] === '}') {
		// Set objectEnd on last entry
		if (entries.length > 0) {
			entries[entries.length - 1].objectEnd = i + 1;
		}
		return entries;
	}

	return null;
}

interface ParsedKey {
	key: string;
	end: number;
}

function parseStringKey(code: string, pos: number): ParsedKey | null {
	if (code[pos] !== '"' && code[pos] !== "'") return null;
	const quote = code[pos];
	let i = pos + 1;
	let key = '';
	while (i < code.length && code[i] !== quote) {
		if (code[i] === '\\') {
			key += code[i + 1];
			i += 2;
		} else {
			key += code[i];
			i++;
		}
	}
	if (i >= code.length) return null;
	return { key, end: i + 1 };
}

/**
 * Starting at `pos`, scans forward until finding `,` or `)` at nesting depth 0.
 * Handles strings, template literals, and nested braces/parens/brackets.
 */
function scanToCommaOrClose(code: string, pos: number): number {
	return scanTo(code, pos, [',', ')']);
}

/**
 * Starting at `pos`, scans forward until finding `,` or `}` at nesting depth 0.
 */
function scanToCommaOrCloseBrace(code: string, pos: number): number {
	return scanTo(code, pos, [',', '}']);
}

/**
 * Scans forward from `pos` until finding one of `stopChars` at nesting depth 0.
 * Correctly handles strings, template literals (with nesting), and bracket nesting.
 */
function scanTo(code: string, pos: number, stopChars: string[]): number {
	const stack: string[] = [];
	let i = pos;

	while (i < code.length) {
		const top = stack.length > 0 ? stack[stack.length - 1] : null;

		// Template literal body
		if (top === '`') {
			if (code[i] === '\\') {
				i += 2;
				continue;
			}
			if (code[i] === '`') {
				stack.pop();
				i++;
				continue;
			}
			if (code[i] === '$' && i + 1 < code.length && code[i + 1] === '{') {
				stack.push('${');
				i += 2;
				continue;
			}
			i++;
			continue;
		}

		// JS context (top is null, '{', '(', '[', or '${')

		// String literals
		if (code[i] === '"' || code[i] === "'") {
			const quote = code[i];
			i++;
			while (i < code.length && code[i] !== quote) {
				if (code[i] === '\\') i++;
				i++;
			}
			i++;
			continue;
		}

		// Template literal start
		if (code[i] === '`') {
			stack.push('`');
			i++;
			continue;
		}

		// Opening brackets
		if (code[i] === '{') {
			stack.push('{');
			i++;
			continue;
		}
		if (code[i] === '(') {
			stack.push('(');
			i++;
			continue;
		}
		if (code[i] === '[') {
			stack.push('[');
			i++;
			continue;
		}

		// Closing brackets
		if (code[i] === '}') {
			if (top === '{') {
				stack.pop();
				i++;
				continue;
			}
			if (top === '${') {
				stack.pop();
				i++;
				continue;
			}
			// At depth 0, `}` is a stop char if requested
			if (stack.length === 0 && stopChars.includes('}')) {
				return i;
			}
			i++;
			continue;
		}
		if (code[i] === ')') {
			if (top === '(') {
				stack.pop();
				i++;
				continue;
			}
			if (stack.length === 0 && stopChars.includes(')')) {
				return i;
			}
			i++;
			continue;
		}
		if (code[i] === ']') {
			if (top === '[') stack.pop();
			i++;
			continue;
		}

		// Stop chars at depth 0
		if (stack.length === 0 && stopChars.includes(code[i])) {
			return i;
		}

		i++;
	}

	return i;
}

function skipWhitespace(code: string, pos: number): number {
	while (pos < code.length && /\s/.test(code[pos])) pos++;
	return pos;
}

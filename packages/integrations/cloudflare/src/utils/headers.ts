/**
 * Convert a Cloudflare `_headers` URL pattern (path portion) into a regex.
 *
 * Pattern syntax per Cloudflare docs:
 * - `*` is a splat that matches anything greedily (one allowed per pattern).
 * - `:name` is a placeholder that matches non-delimiter chars (no `/`).
 *   Names match `[A-Za-z]\w*`.
 * - All other characters are literal.
 */
function cfHeadersPatternToRegex(pattern: string): RegExp {
	let regexStr = '';
	let i = 0;
	while (i < pattern.length) {
		const ch = pattern[i];
		if (ch === '*') {
			regexStr += '.*';
			i++;
		} else if (ch === ':' && /[A-Za-z]/.test(pattern[i + 1] ?? '')) {
			i++;
			while (i < pattern.length && /[A-Za-z0-9_]/.test(pattern[i])) i++;
			regexStr += '[^/]+';
		} else {
			regexStr += ch.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
			i++;
		}
	}
	return new RegExp(`^${regexStr}$`);
}

/**
 * Returns true if the given `_headers` content already declares (or detaches)
 * a `Cache-Control` directive on any rule whose URL pattern matches `path`.
 *
 * Used to avoid emitting a second `Cache-Control` rule for hashed assets when
 * the user already has one — Cloudflare merges duplicate header values across
 * matching rules with a comma, which produces contradictory cache directives.
 */
export function headersFileHasCacheControlForPath(content: string, path: string): boolean {
	let matchesCurrentSection = false;
	for (const rawLine of content.split('\n')) {
		const trimmed = rawLine.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const isSectionHeader = !/^\s/.test(rawLine);
		if (isSectionHeader) {
			const pathOnly = trimmed.replace(/^https?:\/\/[^/]+/, '');
			try {
				matchesCurrentSection = cfHeadersPatternToRegex(pathOnly).test(path);
			} catch {
				matchesCurrentSection = false;
			}
		} else if (
			matchesCurrentSection &&
			// Either `Cache-Control: value` (set) or `! Cache-Control` (detach).
			/^\s+(!\s+cache-control\s*$|cache-control\s*:)/i.test(rawLine)
		) {
			return true;
		}
	}
	return false;
}

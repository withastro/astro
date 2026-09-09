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
			while (i < pattern.length && /\w/.test(pattern[i])) i++;
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
		// Any non-indented non-empty line is treated as a section header. This is
		// intentionally loose: a line at column 0 that isn't a valid CF pattern will
		// produce a regex that never matches, and the section will be silently skipped.
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
			/^\s+(?:!\s+cache-control\s*$|cache-control\s*:)/i.test(rawLine)
		) {
			return true;
		}
	}
	return false;
}

/**
 * Computes the content to write to `_headers` to inject an immutable
 * Cache-Control rule for the hashed assets directory.
 *
 * Returns `null` when injection should be skipped because the existing
 * `_headers` already declares `Cache-Control` on a rule matching the assets
 * path — Cloudflare merges duplicate header values with a comma, which would
 * produce contradictory directives.
 */
export async function buildAssetsHeadersContent(
	opts: {
		assetsDir: string;
		basePrefix: string;
		headersPath: URL;
	},
	readFile: (path: URL) => Promise<string>,
): Promise<{ content: string; assetsPattern: string } | null> {
	const { assetsDir, basePrefix, headersPath } = opts;
	const assetsPattern = `${basePrefix}/${assetsDir}/*`;
	const probePath = `${basePrefix}/${assetsDir}/probe`;

	let existingHeaders = '';
	try {
		existingHeaders = await readFile(headersPath);
	} catch {
		// _headers doesn't exist yet — start from scratch
	}

	if (headersFileHasCacheControlForPath(existingHeaders, probePath)) {
		return null;
	}

	const cacheBlock = `${assetsPattern}\n  Cache-Control: public, max-age=31536000, immutable\n`;
	const normalizedExisting =
		existingHeaders && !existingHeaders.endsWith('\n') ? existingHeaders + '\n' : existingHeaders;
	const content = normalizedExisting ? `${cacheBlock}\n${normalizedExisting}` : cacheBlock;
	return { content, assetsPattern };
}

import { readFile } from 'node:fs/promises';
import type { Plugin } from 'vite';

// Matches the frontmatter block (--- ... ---) at the start of an .astro file.
const FRONTMATTER_RE = /^---(.*?)^---/ms;
// Matches HTML comments.
const COMMENT_RE = /<!--.*?-->/gs;
// Matches <script> tags and captures the opening tag + inner content.
// Uses the `s` flag so `.` matches newlines (multi-line scripts).
const SCRIPT_RE =
	/(<script(?:\s+[a-z_:][-\w:]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^"'<>=\s]+))?)*\s*>)(.*?)<\/script>/gis;
const SRC_RE = /\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s'">]+))/i;
const TYPE_RE = /\btype\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s'">]+))/i;

/**
 * Extracts `<script>` tag contents from an .astro file body (after
 * stripping the frontmatter block).  Returns JS code containing the
 * inline script bodies and `import` statements for `src` scripts.
 */
export function extractScripts(raw: string): string {
	// Strip frontmatter to prevent false <script> matches from text
	// like `<script src="">` inside JS comments (see #18068).
	let body = raw.replace(FRONTMATTER_RE, (m) => m.replace(/[^\n]/g, ' '));
	body = body.replace(COMMENT_RE, '<!---->');

	let js = '';
	for (const [, openTag, content] of body.matchAll(SCRIPT_RE)) {
		const typeMatch = TYPE_RE.exec(openTag);
		const type = typeMatch && (typeMatch[1] || typeMatch[2] || typeMatch[3]);
		// Skip non-JS script types (e.g. application/json, application/ld+json)
		if (
			type &&
			!(type.includes('javascript') || type.includes('ecmascript') || type === 'module')
		) {
			continue;
		}

		const srcMatch = SRC_RE.exec(openTag);
		if (srcMatch) {
			js += `import ${JSON.stringify(srcMatch[1] || srcMatch[2] || srcMatch[3])}\n`;
		} else if (content.trim()) {
			js += content + '\n';
		}
	}

	return js;
}

/**
 * Rolldown plugin for the client dep scan that correctly handles .astro
 * files. Vite's built-in HTML-type scanner matches `<script` tags with
 * a naive regex that does not understand Astro frontmatter fences, so a
 * `<script` string inside a JS comment in the frontmatter is treated as
 * a real script tag. This plugin intercepts .astro loads, strips the
 * frontmatter first, then extracts only the real `<script>` tags.
 */
export function rolldownAstroClientScanPlugin(): Plugin {
	return {
		name: 'astro:client-dep-scan',
		load: {
			filter: { id: /\.astro$/ },
			async handler(id) {
				let raw: string;
				try {
					raw = await readFile(id, 'utf-8');
				} catch {
					return { code: 'export default {}', moduleType: 'ts' };
				}

				const js = extractScripts(raw);
				return {
					code: js + '\nexport default {}',
					moduleType: 'ts',
				};
			},
		},
	};
}

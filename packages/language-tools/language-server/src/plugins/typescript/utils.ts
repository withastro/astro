import type { TextEdit } from 'vscode-html-languageservice';
import type { AstroVirtualCode } from '../../core/index.js';
import { editShouldBeInFrontmatter, ensureProperEditForFrontmatter } from '../utils.js';

const ASTRO_COMPONENT_SUFFIX = 'AstroComponent';
const ASTRO_IMPORT_FROM_PATTERN = /\bfrom\s+['"][^'"]+\.astro['"]/;
const ASTRO_DEFAULT_IMPORT_PATTERN =
	/^(\s*import(?:\s+type)?\s+)([A-Za-z_$][\w$]*)AstroComponent(?=\s*,|\s+from\b)/;
const ASTRO_DEFAULT_ALIAS_PATTERN =
	/(default\s+as\s+)([A-Za-z_$][\w$]*)AstroComponent(?=\s*\})/;
const EXISTING_ASTRO_VALUE_IMPORT_PATTERN =
	/^\s*import\s+(?!type\b)([\s\S]*?)\s+from\s+['"]([^'"]+\.astro)['"]/gm;
const DEFAULT_IMPORT_CLAUSE_PATTERN = /^[A-Za-z_$][\w$]*(?:\s*,|$)/;
const DEFAULT_ALIAS_IMPORT_CLAUSE_PATTERN = /\{\s*default\s+as\s+[A-Za-z_$][\w$]*/;

export function isAstroComponentImportSource(source: string | undefined): source is string {
	return !!source && source.endsWith('.astro');
}

export function stripAstroComponentSuffix(name: string) {
	if (!name.endsWith(ASTRO_COMPONENT_SUFFIX)) {
		return name;
	}

	return name.slice(0, -ASTRO_COMPONENT_SUFFIX.length);
}

export function rewriteAstroImportText(text: string) {
	return text
		.split('\n')
		.map((line) => {
			if (!ASTRO_IMPORT_FROM_PATTERN.test(line)) {
				return line;
			}

			return line
				.replace(ASTRO_DEFAULT_IMPORT_PATTERN, '$1$2')
				.replace(ASTRO_DEFAULT_ALIAS_PATTERN, '$1$2');
		})
		.join('\n');
}

export function getAlreadyImportedAstroComponentSources(documentText: string) {
	const sources = new Set<string>();

	for (const match of documentText.matchAll(EXISTING_ASTRO_VALUE_IMPORT_PATTERN)) {
		const importClause = match[1]?.trim();
		const source = match[2];

		if (
			!importClause ||
			!source ||
			(!DEFAULT_IMPORT_CLAUSE_PATTERN.test(importClause) &&
				!DEFAULT_ALIAS_IMPORT_CLAUSE_PATTERN.test(importClause))
		) {
			continue;
		}

		sources.add(source);
	}

	return sources;
}

export function mapEdit(edit: TextEdit, code: AstroVirtualCode, languageId: string) {
	// Don't attempt to move the edit to the frontmatter if the file isn't the root TSX file, it means it's a script tag
	if (languageId === 'typescriptreact') {
		if (editShouldBeInFrontmatter(edit.range, code.astroMeta).itShould) {
			edit = ensureProperEditForFrontmatter(edit, code.astroMeta, '\n');
		}
	} else {
		// If the edit is at the start of the file, add a newline before it; otherwise, we'll get `<script>text`
		if (edit.range.start.line === 0 && edit.range.start.character === 0) {
			edit.newText = '\n' + edit.newText;
		}
	}

	edit.newText = rewriteAstroImportText(edit.newText);

	return edit;
}

import type { TextEdit } from 'vscode-html-languageservice';
import type { AstroVirtualCode } from '../../core/index.js';
import { editShouldBeInFrontmatter, ensureProperEditForFrontmatter } from '../utils.js';

const ASTRO_COMPONENT_SUFFIX = 'AstroComponent';

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
		.replace(
			/(import\s+(?:type\s+)?)([A-Za-z_$][\w$]*?)AstroComponent(\s*(?:,\s*\{[^}]*\})?\s*from\s*['"][^'"]+\.astro['"])/g,
			'$1$2$3',
		)
		.replace(
			/(import\s+\{\s*default\s+as\s+)([A-Za-z_$][\w$]*?)AstroComponent(\s*\}\s*from\s*['"][^'"]+\.astro['"])/g,
			'$1$2$3',
		);
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

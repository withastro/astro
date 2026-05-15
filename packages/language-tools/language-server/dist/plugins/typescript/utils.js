'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.isAstroComponentImportSource = isAstroComponentImportSource;
exports.stripAstroComponentSuffix = stripAstroComponentSuffix;
exports.rewriteAstroImportText = rewriteAstroImportText;
exports.getAlreadyImportedAstroComponentSources = getAlreadyImportedAstroComponentSources;
exports.mapEdit = mapEdit;
const utils_js_1 = require('../utils.js');
const ASTRO_COMPONENT_SUFFIX = 'AstroComponent';
const ASTRO_IMPORT_FROM_PATTERN = /\bfrom\s+['"][^'"]+\.astro['"]/;
const ASTRO_DEFAULT_IMPORT_PATTERN =
	/^(\s*import(?:\s+type)?\s+)([A-Za-z_$][\w$]*)AstroComponent(?=\s*,|\s+from\b)/;
const ASTRO_DEFAULT_ALIAS_PATTERN = /(default\s+as\s+)([A-Za-z_$][\w$]*)AstroComponent(?=\s*\})/;
function isAstroComponentImportSource(source) {
	return !!source && source.endsWith('.astro');
}
function stripAstroComponentSuffix(name) {
	if (!name.endsWith(ASTRO_COMPONENT_SUFFIX)) {
		return name;
	}
	return name.slice(0, -ASTRO_COMPONENT_SUFFIX.length);
}
function rewriteAstroImportText(text) {
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
function getAlreadyImportedAstroComponentSources(ts, documentText) {
	const sources = new Set();
	const sourceFile = ts.createSourceFile(
		'component-imports.tsx',
		getImportParseText(documentText),
		ts.ScriptTarget.Latest,
		false,
		ts.ScriptKind.TSX,
	);
	for (const statement of sourceFile.statements) {
		if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
			continue;
		}
		const source = statement.moduleSpecifier.text;
		const importClause = statement.importClause;
		if (!importClause || importClause.isTypeOnly || !isAstroComponentImportSource(source)) {
			continue;
		}
		if (importClause.name) {
			sources.add(source);
			continue;
		}
		const namedBindings = importClause.namedBindings;
		if (!namedBindings || !ts.isNamedImports(namedBindings)) {
			continue;
		}
		if (namedBindings.elements.some((element) => element.propertyName?.text === 'default')) {
			sources.add(source);
		}
	}
	return sources;
}
function getImportParseText(documentText) {
	if (!documentText.startsWith('---')) {
		return documentText;
	}
	const lines = documentText.split('\n');
	if (lines[0]?.trim() !== '---') {
		return documentText;
	}
	const closingFrontmatterLine = lines.findIndex(
		(line, index) => index > 0 && line.trim() === '---',
	);
	return lines
		.slice(1, closingFrontmatterLine === -1 ? undefined : closingFrontmatterLine)
		.join('\n');
}
function mapEdit(edit, code, languageId) {
	// Don't attempt to move the edit to the frontmatter if the file isn't the root TSX file, it means it's a script tag
	if (languageId === 'typescriptreact') {
		if ((0, utils_js_1.editShouldBeInFrontmatter)(edit.range, code.astroMeta).itShould) {
			edit = (0, utils_js_1.ensureProperEditForFrontmatter)(edit, code.astroMeta, '\n');
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
//# sourceMappingURL=utils.js.map

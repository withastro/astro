'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.isJSDocument = isJSDocument;
exports.isPossibleComponent = isPossibleComponent;
exports.isInComponentStartTag = isInComponentStartTag;
exports.isInsideExpression = isInsideExpression;
exports.isInsideFrontmatter = isInsideFrontmatter;
exports.ensureProperEditForFrontmatter = ensureProperEditForFrontmatter;
exports.ensureRangeIsInFrontmatter = ensureRangeIsInFrontmatter;
exports.getNewFrontmatterEdit = getNewFrontmatterEdit;
exports.getOpenFrontmatterEdit = getOpenFrontmatterEdit;
exports.editShouldBeInFrontmatter = editShouldBeInFrontmatter;
const vscode_html_languageservice_1 = require('vscode-html-languageservice');
function isJSDocument(languageId) {
	return (
		languageId === 'javascript' ||
		languageId === 'typescript' ||
		languageId === 'javascriptreact' ||
		languageId === 'typescriptreact'
	);
}
/**
 * Return true if a specific node could be a component.
 * This is not a 100% sure test as it'll return false for any component that does not match the standard format for a component
 */
function isPossibleComponent(node) {
	if (!node.tag) return false;
	return !!/[A-Z]/.test(node.tag?.[0]) || !!/.+\.[A-Z]?/.test(node.tag);
}
/**
 * Return if a given offset is inside the start tag of a component
 */
function isInComponentStartTag(html, offset) {
	const node = html.findNodeAt(offset);
	return isPossibleComponent(node) && (!node.startTagEnd || offset < node.startTagEnd);
}
/**
 * Return if a given position is inside a JSX expression
 */
function isInsideExpression(html, tagStart, position) {
	const charactersInNode = html.substring(tagStart, position);
	return charactersInNode.lastIndexOf('{') > charactersInNode.lastIndexOf('}');
}
/**
 * Return if a given offset is inside the frontmatter
 */
function isInsideFrontmatter(offset, frontmatter) {
	switch (frontmatter.status) {
		case 'closed':
			return offset > frontmatter.position.start.offset && offset < frontmatter.position.end.offset;
		case 'open':
			return offset > frontmatter.position.start.offset;
		case 'doesnt-exist':
			return false;
	}
}
function ensureProperEditForFrontmatter(edit, metadata, newLine, position = 'top') {
	switch (metadata.frontmatter.status) {
		case 'open':
			return getOpenFrontmatterEdit(edit, metadata, newLine);
		case 'closed':
			const newRange = ensureRangeIsInFrontmatter(edit.range, metadata, position);
			return {
				newText:
					newRange.start.line === metadata.frontmatter.position.start.line &&
					edit.newText.startsWith(newLine)
						? edit.newText.trimStart()
						: edit.newText,
				range: newRange,
			};
		case 'doesnt-exist':
			return getNewFrontmatterEdit(edit, metadata, newLine);
	}
}
/**
 * Force a range to be at the start of the frontmatter if it is outside
 */
function ensureRangeIsInFrontmatter(range, metadata, position = 'top') {
	if (metadata.frontmatter.status === 'open' || metadata.frontmatter.status === 'closed') {
		const frontmatterEndPosition = metadata.frontmatter.position.end
			? metadata.tsxRanges.frontmatter.end
			: undefined;
		// If the range start is outside the frontmatter, return a range at the start of the frontmatter
		if (
			range.start.line < metadata.tsxRanges.frontmatter.start.line ||
			(frontmatterEndPosition && range.start.line > frontmatterEndPosition.line)
		) {
			if (frontmatterEndPosition && position === 'bottom') {
				return vscode_html_languageservice_1.Range.create(
					frontmatterEndPosition,
					frontmatterEndPosition,
				);
			}
			return vscode_html_languageservice_1.Range.create(
				metadata.tsxRanges.frontmatter.start,
				metadata.tsxRanges.frontmatter.start,
			);
		}
		return range;
	}
	return range;
}
function getNewFrontmatterEdit(edit, astroMetadata, newLine) {
	edit.newText = `---${edit.newText.startsWith(newLine) ? '' : newLine}${edit.newText}---${newLine}${newLine}`;
	edit.range = vscode_html_languageservice_1.Range.create(
		astroMetadata.tsxRanges.frontmatter.start,
		astroMetadata.tsxRanges.frontmatter.start,
	);
	return edit;
}
function getOpenFrontmatterEdit(edit, astroMetadata, newLine) {
	edit.newText = edit.newText.startsWith(newLine)
		? `${edit.newText}---`
		: `${newLine}${edit.newText}---`;
	edit.range = vscode_html_languageservice_1.Range.create(
		astroMetadata.tsxRanges.frontmatter.start,
		astroMetadata.tsxRanges.frontmatter.start,
	);
	return edit;
}
// Most edits that are at the beginning of the TSX, or outside the document are intended for the frontmatter
function editShouldBeInFrontmatter(range, astroMetadata) {
	const isAtTSXStart = range.start.line < astroMetadata.tsxRanges.frontmatter.start.line;
	const isPastFile = range.start.line > astroMetadata.tsxRanges.body.end.line;
	const shouldIt = isAtTSXStart || isPastFile;
	return shouldIt
		? { itShould: true, position: isPastFile ? 'bottom' : 'top' }
		: { itShould: false, position: undefined };
}
//# sourceMappingURL=utils.js.map

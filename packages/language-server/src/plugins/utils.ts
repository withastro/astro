import { HTMLDocument, Node, Range, TextDocument, TextEdit } from 'vscode-html-languageservice';
import type { FrontmatterStatus } from '../core/parseAstro.js';

export function isJSDocument(languageId: string) {
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
export function isPossibleComponent(node: Node): boolean {
	return !!node.tag?.[0].match(/[A-Z]/) || !!node.tag?.match(/.+[.][A-Z]?/);
}

/**
 * Return if a given offset is inside the start tag of a component
 */
export function isInComponentStartTag(html: HTMLDocument, offset: number): boolean {
	const node = html.findNodeAt(offset);
	return isPossibleComponent(node) && (!node.startTagEnd || offset < node.startTagEnd);
}

/**
 * Return if a given position is inside a JSX expression
 */
export function isInsideExpression(html: string, tagStart: number, position: number) {
	const charactersInNode = html.substring(tagStart, position);
	return charactersInNode.lastIndexOf('{') > charactersInNode.lastIndexOf('}');
}

/**
 * Return if a given offset is inside the frontmatter
 */
export function isInsideFrontmatter(offset: number, frontmatter: FrontmatterStatus) {
	switch (frontmatter.status) {
		case 'closed':
			return offset > frontmatter.position.start.offset && offset < frontmatter.position.end.offset;
		case 'open':
			return offset > frontmatter.position.start.offset;
		case 'doesnt-exist':
			return false;
	}
}

type FrontmatterEditPosition = 'top' | 'bottom';

export function ensureProperEditForFrontmatter(
	edit: TextEdit,
	frontmatter: FrontmatterStatus,
	newLine: string,
	position: FrontmatterEditPosition = 'top'
): TextEdit {
	switch (frontmatter.status) {
		case 'open':
			return getOpenFrontmatterEdit(edit, newLine);
		case 'closed':
			return {
				newText: edit.newText,
				range: ensureRangeIsInFrontmatter(edit.range, frontmatter, position),
			};
		case 'doesnt-exist':
			return getNewFrontmatterEdit(edit, newLine);
	}
}

/**
 * Force a range to be at the start of the frontmatter if it is outside
 */
export function ensureRangeIsInFrontmatter(
	range: Range,
	frontmatter: FrontmatterStatus,
	position: FrontmatterEditPosition = 'top'
): Range {
	if (frontmatter.status === 'open' || frontmatter.status === 'closed') {
		// Q: Why not use PointToPosition?
		// A: The Astro compiler returns positions at the exact line where the frontmatter is, which is not adequate for mapping
		// edits as we want edits *inside* the frontmatter and not on the same line, or you would end up with things like `---import ...`
		const frontmatterStartPosition = {
			line: frontmatter.position.start.line,
			character: frontmatter.position.start.column - 1,
		};
		const frontmatterEndPosition = frontmatter.position.end
			? { line: frontmatter.position.end.line - 1, character: 0 }
			: undefined;

		// If the range start is outside the frontmatter, return a range at the start of the frontmatter
		if (
			range.start.line < frontmatterStartPosition.line ||
			(frontmatterEndPosition && range.start.line > frontmatterEndPosition.line)
		) {
			if (frontmatterEndPosition && position === 'bottom') {
				return Range.create(frontmatterEndPosition, frontmatterEndPosition);
			}

			return Range.create(frontmatterStartPosition, frontmatterStartPosition);
		}

		return range;
	}

	return range;
}

export function getNewFrontmatterEdit(edit: TextEdit, newLine: string) {
	edit.newText = `---${newLine}${edit.newText}---${newLine}${newLine}`;
	edit.range = Range.create(0, 0, 0, 0);

	return edit;
}

export function getOpenFrontmatterEdit(edit: TextEdit, newLine: string) {
	edit.newText = edit.newText.startsWith(newLine)
		? `${edit.newText}---`
		: `${newLine}${edit.newText}---`;
	return edit;
}

type FrontmatterEditValidity =
	| { itShould: false; position: undefined }
	| { itShould: true; position: FrontmatterEditPosition };

// Most edits that are at 0:0, or outside the document are intended for the frontmatter
export function editShouldBeInFrontmatter(
	range: Range,
	astroDocument?: TextDocument
): FrontmatterEditValidity {
	const isAtZeroZero = range.start.line === 0 && range.start.character === 0;

	const isPastFile = astroDocument && range.start.line > astroDocument.lineCount;
	const shouldIt = isAtZeroZero || isPastFile;

	return shouldIt
		? { itShould: true, position: isPastFile ? 'bottom' : 'top' }
		: { itShould: false, position: undefined };
}

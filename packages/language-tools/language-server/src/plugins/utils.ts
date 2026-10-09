import type { HTMLDocument, Node, TextEdit } from 'vscode-html-languageservice';
import { Range } from 'vscode-html-languageservice';
import type { AstroMetadata, FrontmatterStatus } from '../core/parseAstro.js';

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
	if (!node.tag) return false;
	return !!/[A-Z]/.test(node.tag?.[0]) || !!/.+\.[A-Z]?/.test(node.tag);
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
	metadata: AstroMetadata,
	newLine: string,
	position: FrontmatterEditPosition = 'top',
): TextEdit {
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
export function ensureRangeIsInFrontmatter(
	range: Range,
	metadata: AstroMetadata,
	position: FrontmatterEditPosition = 'top',
): Range {
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
				return Range.create(frontmatterEndPosition, frontmatterEndPosition);
			}

			return Range.create(
				metadata.tsxRanges.frontmatter.start,
				metadata.tsxRanges.frontmatter.start,
			);
		}

		return range;
	}

	return range;
}

export function getNewFrontmatterEdit(
	edit: TextEdit,
	astroMetadata: AstroMetadata,
	newLine: string,
) {
	edit.newText = `---${edit.newText.startsWith(newLine) ? '' : newLine}${
		edit.newText
	}---${newLine}${newLine}`;
	edit.range = Range.create(
		astroMetadata.tsxRanges.frontmatter.start,
		astroMetadata.tsxRanges.frontmatter.start,
	);

	return edit;
}

export function getOpenFrontmatterEdit(
	edit: TextEdit,
	astroMetadata: AstroMetadata,
	newLine: string,
) {
	edit.newText = edit.newText.startsWith(newLine)
		? `${edit.newText}---`
		: `${newLine}${edit.newText}---`;
	edit.range = Range.create(
		astroMetadata.tsxRanges.frontmatter.start,
		astroMetadata.tsxRanges.frontmatter.start,
	);
	return edit;
}

type FrontmatterEditValidity =
	| { itShould: false; position: undefined }
	| { itShould: true; position: FrontmatterEditPosition };

// Most edits that are at the beginning of the TSX, or outside the document are intended for the frontmatter
export function editShouldBeInFrontmatter(
	range: Range,
	astroMetadata: AstroMetadata,
): FrontmatterEditValidity {
	const isAtTSXStart = range.start.line < astroMetadata.tsxRanges.frontmatter.start.line;

	const isPastFile = range.start.line > astroMetadata.tsxRanges.body.end.line;
	const shouldIt = isAtTSXStart || isPastFile;

	return shouldIt
		? { itShould: true, position: isPastFile ? 'bottom' : 'top' }
		: { itShould: false, position: undefined };
}

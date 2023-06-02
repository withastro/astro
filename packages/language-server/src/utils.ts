import type { AttributeNode, Position as CompilerPosition, Point } from '@astrojs/compiler/types';
import path from 'node:path';
import {
	HTMLDocument,
	Position as LSPPosition,
	Node,
	Range,
	TextEdit,
} from 'vscode-html-languageservice';
import type { FrontmatterStatus } from './core/parseAstro.js';

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

/**
 * Transform a Point from the Astro compiler to an LSP Position
 */
export function PointToPosition(point: Point) {
	// Columns are 0-based in LSP, but the compiler's Point are 1 based.
	return LSPPosition.create(point.line, point.column - 1);
}

export function createCompilerPosition(start: Point, end: Point): CompilerPosition {
	return {
		start,
		end,
	};
}

export function createCompilerPoint(line: number, column: number, offset: number): Point {
	return {
		line,
		column,
		offset,
	};
}

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type AttributeNodeWithPosition = WithRequired<AttributeNode, 'position'>;

/**
 * Force a range to be at the start of the frontmatter if it is outside
 */
export function ensureRangeIsInFrontmatter(range: Range, frontmatter: FrontmatterStatus): Range {
	if (frontmatter.status === 'open' || frontmatter.status === 'closed') {
		const frontmatterStartPosition = PointToPosition(frontmatter.position.start);
		const frontmatterEndPosition = frontmatter.position.end
			? PointToPosition(frontmatter.position.end)
			: undefined;

		// If the range start is outside the frontmatter, return a range at the start of the frontmatter
		if (
			range.start.line < frontmatterStartPosition.line ||
			(frontmatterEndPosition && range.start.line > frontmatterEndPosition.line)
		) {
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

export function getWorkspacePnpPath(workspacePath: string): string | null {
	try {
		const possiblePath = path.resolve(workspacePath, '.pnp.cjs');
		require.resolve(possiblePath);
		return possiblePath;
	} catch {
		return null;
	}
}

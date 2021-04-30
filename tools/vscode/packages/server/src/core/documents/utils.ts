import { Position } from 'vscode-html-languageservice';
import { clamp } from '../../utils';

/**
 * Gets word range at position.
 * Delimiter is by default a whitespace, but can be adjusted.
 */
export function getWordRangeAt(
    str: string,
    pos: number,
    delimiterRegex = { left: /\S+$/, right: /\s/ }
): { start: number; end: number } {
    let start = str.slice(0, pos).search(delimiterRegex.left);
    if (start < 0) {
        start = pos;
    }

    let end = str.slice(pos).search(delimiterRegex.right);
    if (end < 0) {
        end = str.length;
    } else {
        end = end + pos;
    }

    return { start, end };
}

/**
 * Gets word at position.
 * Delimiter is by default a whitespace, but can be adjusted.
 */
export function getWordAt(
    str: string,
    pos: number,
    delimiterRegex = { left: /\S+$/, right: /\s/ }
): string {
    const { start, end } = getWordRangeAt(str, pos, delimiterRegex);
    return str.slice(start, end);
}

/**
 * Gets index of first-non-whitespace character.
 */
export function getFirstNonWhitespaceIndex(str: string): number {
    return str.length - str.trimStart().length;
}

/** checks if a position is currently inside of an expression */
export function isInsideExpression(html: string, tagStart: number, position: number) {
    const charactersInNode = html.substring(tagStart, position);
    return charactersInNode.lastIndexOf('{') > charactersInNode.lastIndexOf('}');
}

/**
 * Returns if a given offset is inside of the document frontmatter 
 */
export function isInsideFrontmatter(
    text: string,
    offset: number
): boolean {
    let start = text.slice(0, offset).trim().split('---').length;
    let end = text.slice(offset).trim().split('---').length;

    return start > 1 && start < 3 && end >= 1;
}

/**
 * Get the line and character based on the offset
 * @param offset The index of the position
 * @param text The text for which the position should be retrived
 */
export function positionAt(offset: number, text: string): Position {
    offset = clamp(offset, 0, text.length);

    const lineOffsets = getLineOffsets(text);
    let low = 0;
    let high = lineOffsets.length;
    if (high === 0) {
        return Position.create(0, offset);
    }

    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (lineOffsets[mid] > offset) {
            high = mid;
        } else {
            low = mid + 1;
        }
    }

    // low is the least x for which the line offset is larger than the current offset
    // or array.length if no line offset is larger than the current offset
    const line = low - 1;
    return Position.create(line, offset - lineOffsets[line]);
}

/**
 * Get the offset of the line and character position
 * @param position Line and character position
 * @param text The text for which the offset should be retrived
 */
export function offsetAt(position: Position, text: string): number {
    const lineOffsets = getLineOffsets(text);

    if (position.line >= lineOffsets.length) {
        return text.length;
    } else if (position.line < 0) {
        return 0;
    }

    const lineOffset = lineOffsets[position.line];
    const nextLineOffset =
        position.line + 1 < lineOffsets.length ? lineOffsets[position.line + 1] : text.length;

    return clamp(nextLineOffset, lineOffset, lineOffset + position.character);
}

function getLineOffsets(text: string) {
    const lineOffsets = [];
    let isLineStart = true;

    for (let i = 0; i < text.length; i++) {
        if (isLineStart) {
            lineOffsets.push(i);
            isLineStart = false;
        }
        const ch = text.charAt(i);
        isLineStart = ch === '\r' || ch === '\n';
        if (ch === '\r' && i + 1 < text.length && text.charAt(i + 1) === '\n') {
            i++;
        }
    }

    if (isLineStart && text.length > 0) {
        lineOffsets.push(text.length);
    }

    return lineOffsets;
}

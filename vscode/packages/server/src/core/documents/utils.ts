import { Node, HTMLDocument } from 'vscode-html-languageservice';

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

import { clamp, isInRange, regexLastIndexOf } from '../../utils';
import { Position, Range } from 'vscode-languageserver';
import { Node, HTMLDocument } from 'vscode-html-languageservice';
import * as path from 'path';
import { parseHtml } from './parseHtml';

export interface TagInformation {
    content: string;
    attributes: Record<string, string>;
    start: number;
    end: number;
    startPos: Position;
    endPos: Position;
    container: { start: number; end: number };
}

function parseAttributes(
    rawAttrs: Record<string, string | null> | undefined
): Record<string, string> {
    const attrs: Record<string, string> = {};
    if (!rawAttrs) {
        return attrs;
    }

    Object.keys(rawAttrs).forEach((attrName) => {
        const attrValue = rawAttrs[attrName];
        attrs[attrName] = attrValue === null ? attrName : removeOuterQuotes(attrValue);
    });
    return attrs;

    function removeOuterQuotes(attrValue: string) {
        if (
            (attrValue.startsWith('"') && attrValue.endsWith('"')) ||
            (attrValue.startsWith("'") && attrValue.endsWith("'"))
        ) {
            return attrValue.slice(1, attrValue.length - 1);
        }
        return attrValue;
    }
}

const regexIf = new RegExp('{#if\\s.*?}', 'gms');
const regexIfEnd = new RegExp('{/if}', 'gms');
const regexEach = new RegExp('{#each\\s.*?}', 'gms');
const regexEachEnd = new RegExp('{/each}', 'gms');
const regexAwait = new RegExp('{#await\\s.*?}', 'gms');
const regexAwaitEnd = new RegExp('{/await}', 'gms');
const regexHtml = new RegExp('{@html\\s.*?', 'gms');

/**
 * Extracts a tag (style or script) from the given text
 * and returns its start, end and the attributes on that tag.
 *
 * @param source text content to extract tag from
 * @param tag the tag to extract
 */
function extractTags(
    text: string,
    tag: 'script' | 'style' | 'template',
    html?: HTMLDocument
): TagInformation[] {
    const rootNodes = html?.roots || parseHtml(text).roots;
    const matchedNodes = rootNodes
        .filter((node) => node.tag === tag)
        .filter((tag) => {
            return isNotInsideControlFlowTag(tag) && isNotInsideHtmlTag(tag);
        });
    return matchedNodes.map(transformToTagInfo);

    /**
     * For every match AFTER the tag do a search for `{/X`.
     * If that is BEFORE `{#X`, we are inside a moustache tag.
     */
    function isNotInsideControlFlowTag(tag: Node) {
        const nodes = rootNodes.slice(rootNodes.indexOf(tag));
        const rootContentAfterTag = nodes
            .map((node, idx) => {
                const start = node.startTagEnd ? node.end : node.start + (node.tag?.length || 0);
                return text.substring(start, nodes[idx + 1]?.start);
            })
            .join('');

        return ![
            [regexIf, regexIfEnd],
            [regexEach, regexEachEnd],
            [regexAwait, regexAwaitEnd]
        ].some((pair) => {
            pair[0].lastIndex = 0;
            pair[1].lastIndex = 0;
            const start = pair[0].exec(rootContentAfterTag);
            const end = pair[1].exec(rootContentAfterTag);
            return (end?.index ?? text.length) < (start?.index ?? text.length);
        });
    }

    /**
     * For every match BEFORE the tag do a search for `{@html`.
     * If that is BEFORE `}`, we are inside a moustache tag.
     */
    function isNotInsideHtmlTag(tag: Node) {
        const nodes = rootNodes.slice(0, rootNodes.indexOf(tag));
        const rootContentBeforeTag = [{ start: 0, end: 0 }, ...nodes]
            .map((node, idx) => {
                return text.substring(node.end, nodes[idx]?.start);
            })
            .join('');

        return !(
            regexLastIndexOf(rootContentBeforeTag, regexHtml) >
            rootContentBeforeTag.lastIndexOf('}')
        );
    }

    function transformToTagInfo(matchedNode: Node) {
        const start = matchedNode.startTagEnd ?? matchedNode.start;
        const end = matchedNode.endTagStart ?? matchedNode.end;
        const startPos = positionAt(start, text);
        const endPos = positionAt(end, text);
        const container = {
            start: matchedNode.start,
            end: matchedNode.end
        };
        const content = text.substring(start, end);

        return {
            content,
            attributes: parseAttributes(matchedNode.attributes),
            start,
            end,
            startPos,
            endPos,
            container
        };
    }
}

export function extractScriptTags(
    source: string,
    html?: HTMLDocument
): { script?: TagInformation; moduleScript?: TagInformation } | null {
    const scripts = extractTags(source, 'script', html);
    if (!scripts.length) {
        return null;
    }

    const script = scripts.find((s) => s.attributes['context'] !== 'module');
    const moduleScript = scripts.find((s) => s.attributes['context'] === 'module');
    return { script, moduleScript };
}

export function extractStyleTag(source: string, html?: HTMLDocument): TagInformation | null {
    const styles = extractTags(source, 'style', html);
    if (!styles.length) {
        return null;
    }

    // There can only be one style tag
    return styles[0];
}

export function extractTemplateTag(source: string, html?: HTMLDocument): TagInformation | null {
    const templates = extractTags(source, 'template', html);
    if (!templates.length) {
        return null;
    }

    // There should only be one style tag
    return templates[0];
}

/**
 * Get the line and character based on the offset
 * @param offset The index of the position
 * @param text The text for which the position should be retrived
 * @param lineOffsets number Array with offsets for each line. Computed if not given
 */
export function positionAt(
    offset: number,
    text: string,
    lineOffsets = getLineOffsets(text)
): Position {
    offset = clamp(offset, 0, text.length);

    let low = 0;
    let high = lineOffsets.length;
    if (high === 0) {
        return Position.create(0, offset);
    }

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const lineOffset = lineOffsets[mid];

        if (lineOffset === offset) {
            return Position.create(mid, 0);
        } else if (offset > lineOffset) {
            low = mid + 1;
        } else {
            high = mid - 1;
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
 * @param lineOffsets number Array with offsets for each line. Computed if not given
 */
export function offsetAt(
    position: Position,
    text: string,
    lineOffsets = getLineOffsets(text)
): number {
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

export function getLineOffsets(text: string) {
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

export function isInTag(
    position: Position,
    tagInfo: TagInformation | null
): tagInfo is TagInformation {
    return !!tagInfo && isInRange(Range.create(tagInfo.startPos, tagInfo.endPos), position);
}

export function isRangeInTag(
    range: Range,
    tagInfo: TagInformation | null
): tagInfo is TagInformation {
    return isInTag(range.start, tagInfo) && isInTag(range.end, tagInfo);
}

export function getTextInRange(range: Range, text: string) {
    return text.substring(offsetAt(range.start, text), offsetAt(range.end, text));
}

export function getLineAtPosition(position: Position, text: string) {
    return text.substring(
        offsetAt({ line: position.line, character: 0 }, text),
        offsetAt({ line: position.line, character: Number.MAX_VALUE }, text)
    );
}

/**
 * Assumption: Is called with a line. A line does only contain line break characters
 * at its end.
 */
export function isAtEndOfLine(line: string, offset: number): boolean {
    return [undefined, '\r', '\n'].includes(line[offset]);
}

/**
 * Updates a relative import
 *
 * @param oldPath Old absolute path
 * @param newPath New absolute path
 * @param relativeImportPath Import relative to the old path
 */
export function updateRelativeImport(oldPath: string, newPath: string, relativeImportPath: string) {
    let newImportPath = path
        .join(path.relative(newPath, oldPath), relativeImportPath)
        .replace(/\\/g, '/');
    if (!newImportPath.startsWith('.')) {
        newImportPath = './' + newImportPath;
    }
    return newImportPath;
}

/**
 * Returns the node if offset is inside a component's starttag
 */
export function getNodeIfIsInComponentStartTag(
    html: HTMLDocument,
    offset: number
): Node | undefined {
    const node = html.findNodeAt(offset);
    if (
        !!node.tag &&
        node.tag[0] === node.tag[0].toUpperCase() &&
        (!node.startTagEnd || offset < node.startTagEnd)
    ) {
        return node;
    }
}

/**
 * Returns the node if offset is inside a HTML starttag
 */
export function getNodeIfIsInHTMLStartTag(html: HTMLDocument, offset: number): Node | undefined {
    const node = html.findNodeAt(offset);
    if (
        !!node.tag &&
        node.tag[0] === node.tag[0].toLowerCase() &&
        (!node.startTagEnd || offset < node.startTagEnd)
    ) {
        return node;
    }
}

/**
 * Returns the node if offset is inside a starttag (HTML or component)
 */
export function getNodeIfIsInStartTag(html: HTMLDocument, offset: number): Node | undefined {
    const node = html.findNodeAt(offset);
    if (!!node.tag && (!node.startTagEnd || offset < node.startTagEnd)) {
        return node;
    }
}

/**
 * Returns `true` if `offset` is a html tag and within the name of the start tag or end tag
 */
export function isInHTMLTagRange(html: HTMLDocument, offset: number): boolean {
    const node = html.findNodeAt(offset);
    return (
        !!node.tag &&
        node.tag[0] === node.tag[0].toLowerCase() &&
        (node.start + node.tag.length + 1 >= offset ||
            (!!node.endTagStart && node.endTagStart <= offset))
    );
}

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
 * Returns start/end offset of a text into a range
 */
export function toRange(str: string, start: number, end: number): Range {
    return Range.create(positionAt(start, str), positionAt(end, str));
}

/**
 * Returns the language from the given tags, return the first from which a language is found.
 * Searches inside lang and type and removes leading 'text/'
 */
export function getLangAttribute(...tags: Array<TagInformation | null>): string | null {
    const tag = tags.find((tag) => tag?.attributes.lang || tag?.attributes.type);
    if (!tag) {
        return null;
    }

    const attribute = tag.attributes.lang || tag.attributes.type;
    if (!attribute) {
        return null;
    }

    return attribute.replace(/^text\//, '');
}

/**
 * Checks whether given position is inside a moustache tag (which includes control flow tags)
 * using a simple bracket matching heuristic which might fail under conditions like
 * `{#if {a: true}.a}`
 */
export function isInsideMoustacheTag(html: string, tagStart: number | null, position: number) {
    if (tagStart === null) {
        // Not inside <tag ... >
        const charactersBeforePosition = html.substring(0, position);
        return (
            Math.max(
                // TODO make this just check for '{'?
                // Theoretically, someone could do {a < b} in a simple moustache tag
                charactersBeforePosition.lastIndexOf('{#'),
                charactersBeforePosition.lastIndexOf('{:')
            ) > charactersBeforePosition.lastIndexOf('}')
        );
    } else {
        // Inside <tag ... >
        const charactersInNode = html.substring(tagStart, position);
        return charactersInNode.lastIndexOf('{') > charactersInNode.lastIndexOf('}');
    }
}

import { HTMLDocument, Node, Position } from 'vscode-html-languageservice';
import { clamp } from '../../utils';
import {parseHtml} from './parseHtml';

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

/**
 * Gets word range at position.
 * Delimiter is by default a whitespace, but can be adjusted.
 */
export function getWordRangeAt(str: string, pos: number, delimiterRegex = { left: /\S+$/, right: /\s/ }): { start: number; end: number } {
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
export function getWordAt(str: string, pos: number, delimiterRegex = { left: /\S+$/, right: /\s/ }): string {
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
export function isInsideFrontmatter(text: string, offset: number): boolean {
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
  const nextLineOffset = position.line + 1 < lineOffsets.length ? lineOffsets[position.line + 1] : text.length;

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

export function* walk(node: Node): Generator<Node, void, unknown> {
  for(let child of node.children) {
    yield * walk(child);
  }
  yield node;
}

/*
export function* walk(node: Node, startIndex = 0) {
	let skip, tmp;
	let depth = 0;
	let index = startIndex;

	// Always start with the initial element.
	do {
		if ( !skip && (tmp = node.firstChild) ) {
			depth++;
			callback('child', node, tmp, index);
			index++;
		} else if ( tmp = node.nextSibling ) {
			skip = false;
			callback('sibling', node, tmp, index);
			index++;
		} else {
			tmp = node.parentNode;
			depth--;
			skip = true;
		}
		node = tmp;
	} while ( depth > 0 );
};
*/

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
      .filter((node) => node.tag === tag);

  if(tag === 'style' && !matchedNodes.length && rootNodes.length && rootNodes[0].tag === 'html') {
    for(let child of walk(rootNodes[0])) {
      if(child.tag === 'style') {
        matchedNodes.push(child);
      }
    }
  }

  return matchedNodes.map(transformToTagInfo);

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

export function extractStyleTag(source: string, html?: HTMLDocument): TagInformation | null {
  const styles = extractTags(source, 'style', html);
  if (!styles.length) {
      return null;
  }

  // There can only be one style tag
  return styles[0];
}
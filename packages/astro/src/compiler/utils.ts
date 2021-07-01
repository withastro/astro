/** Is the given string a custom-element tag? */
export function isCustomElementTag(tag: string) {
  return /[-]/.test(tag);
}

/** Is the given string a valid component tag */
export function isComponentTag(tag: string) {
  return /^[A-Z]/.test(tag) || /^[a-z]+\./.test(tag) || isCustomElementTag(tag);
}

export interface Position {
  line: number;
  character: number;
}

/** Clamps a number between min and max */
export function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, num));
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
    return { line: 0, character: offset };
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
  return { line, character: offset - lineOffsets[line] };
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

/** Get the offset of all lines */
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

import type { AttributeNode, Point } from '@astrojs/compiler';
import { Position as LSPPosition } from '@volar/language-server';

/**
 * Transform a Point from the Astro compiler to an LSP Position
 */
export function PointToPosition(point: Point) {
	// Columns and lines are 0-based in LSP, but the compiler's Point are 1 based.
	return LSPPosition.create(point.line - 1, point.column - 1);
}

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type AttributeNodeWithPosition = WithRequired<AttributeNode, 'position'>;

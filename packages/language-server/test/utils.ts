import path from 'node:path';
import type { Point, Position } from '@astrojs/compiler';

export const fixtureDir = path.join(__dirname, './fixture');

export function createCompilerPosition(start: Point, end: Point): Position {
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

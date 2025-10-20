import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Point, Position } from '@astrojs/compiler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

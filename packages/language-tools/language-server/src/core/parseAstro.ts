import { astro2tsx, type LSPTSXRanges } from './astro2tsx.js';

export type AstroMetadata = {
	frontmatter: FrontmatterStatus;
	tsxRanges: LSPTSXRanges;
};

export interface Point {
	/** 1-based. */
	line: number;
	/** 1-based. */
	column: number;
	offset: number;
}

interface FrontmatterOpen {
	status: 'open';
	position: {
		start: Point;
		end: undefined;
	};
}

interface FrontmatterClosed {
	status: 'closed';
	position: {
		start: Point;
		end: Point;
	};
}

interface FrontmatterNull {
	status: 'doesnt-exist';
	position: undefined;
}

export type FrontmatterStatus = FrontmatterOpen | FrontmatterClosed | FrontmatterNull;

function pointAt(input: string, offset: number): Point {
	let line = 1;
	let lineStart = 0;
	for (let index = 0; index < offset && index < input.length; index++) {
		if (input[index] === '\n') {
			line++;
			lineStart = index + 1;
		}
	}
	return { line, column: offset - lineStart + 1, offset };
}

export function getFrontmatterStatus(
	status: 'closed' | 'open' | 'doesnt-exist',
	source: { start: number; end: number },
	input: string,
): FrontmatterStatus {
	switch (status) {
		case 'closed':
			return {
				status: 'closed',
				position: { start: pointAt(input, source.start), end: pointAt(input, source.end) },
			};
		case 'open':
			return {
				status: 'open',
				position: { start: pointAt(input, source.start), end: undefined },
			};
		case 'doesnt-exist':
			return { status: 'doesnt-exist', position: undefined };
	}
}

export function getAstroMetadata(
	fileName: string,
	input: string,
): Omit<AstroMetadata, 'tsxRanges'> {
	const tsx = astro2tsx(input, fileName);

	return {
		frontmatter: getFrontmatterStatus(tsx.frontmatterStatus, tsx.frontmatterSource, input),
	};
}

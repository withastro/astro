import { parse } from '@astrojs/compiler/sync';
import type { ParseResult, Point } from '@astrojs/compiler/types';

type AstroMetadata = ParseResult & { frontmatter: FrontmatterStatus };

export function getAstroMetadata(input: string, position = true): AstroMetadata {
	const parseResult = parse(input, { position: position });

	return {
		...parseResult,
		frontmatter: getFrontmatterStatus(parseResult.ast),
	};
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

export function getFrontmatterStatus(ast: ParseResult['ast']): FrontmatterStatus {
	if (!ast.children || (ast.children && ast.children.length === 0)) {
		return {
			status: 'doesnt-exist',
			position: undefined,
		};
	}

	if (ast.children[0].type === 'frontmatter') {
		const frontmatter = ast.children[0];
		if (frontmatter.position) {
			if (frontmatter.position.end) {
				return {
					status: 'closed',
					position: {
						start: frontmatter.position.start,
						end: frontmatter.position.end,
					},
				};
			}
			return {
				status: 'open',
				position: {
					start: frontmatter.position.start,
					end: undefined,
				},
			};
		}
	}

	return {
		status: 'doesnt-exist',
		position: undefined,
	};
}

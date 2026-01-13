import { parse } from '@astrojs/compiler/sync';
import type { ParseOptions, ParseResult, Point } from '@astrojs/compiler/types';
import type { LSPTSXRanges } from './astro2tsx.js';

export type AstroMetadata = ParseResult & {
	frontmatter: FrontmatterStatus;
	tsxRanges: LSPTSXRanges;
};

export function getAstroMetadata(
	fileName: string,
	input: string,
	options: ParseOptions = { position: true },
): Omit<AstroMetadata, 'tsxRanges'> {
	const parseResult = safeParseAst(fileName, input, options);

	return {
		...parseResult,
		frontmatter: getFrontmatterStatus(parseResult.ast, input),
	};
}

function safeParseAst(fileName: string, input: string, parseOptions: ParseOptions): ParseResult {
	try {
		const parseResult = parse(input, parseOptions);
		return parseResult;
	} catch (e) {
		console.error(
			`There was an error parsing ${fileName}'s AST. An empty AST will be returned instead to avoid breaking the server. Please create an issue: https://github.com/withastro/astro/issues\nError: ${e}.`,
		);

		return {
			ast: {
				type: 'root',
				children: [],
			},
			diagnostics: [
				{
					code: 1000,
					location: {
						file: fileName,
						line: 1,
						column: 1,
						length: input.length,
					},
					severity: 1,
					text: `The Astro compiler encountered an unknown error while parsing this file's AST. Please create an issue with your code and the error shown in the server's logs: https://github.com/withastro/astro/issues`,
				},
			],
		};
	}
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

function getFrontmatterStatus(ast: ParseResult['ast'], text: string): FrontmatterStatus {
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
				// HACK: The compiler as of 1.5.5 always return an ending position, even if there's only a frontmatter opening
				// This hack checks if the frontmatter's ending is the end of the file, and if so, checks if there's a `---`.
				// If there's not, it means the compiler returned the EOF with an opened frontmatter
				if (frontmatter.position.end.offset === text.length && !text.endsWith('---')) {
					return {
						status: 'open',
						position: {
							start: frontmatter.position.start,
							end: undefined,
						},
					};
				}

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

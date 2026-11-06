import { AstroFrontmatterStatus, type ConvertToTsxResult, convertToTsx } from '@astrojs/astro2tsx';
import type { CodeMapping, VirtualCode } from '@volar/language-core';

const SPAN_MAP_KIND_ATOM = 1;

function safeConvertToTSX(content: string, filename: string): ConvertToTsxResult {
	try {
		return convertToTsx(content, { filename });
	} catch (e) {
		console.error(
			`There was an error transforming ${filename} to TSX. An empty file will be returned instead. Please create an issue: https://github.com/withastro/astro/issues\nError: ${e}.`,
		);

		return {
			code: '',
			mappings: [],
			frontmatter: { start: 0, end: 0 },
			body: { start: 0, end: 0 },
			frontmatterStatus: AstroFrontmatterStatus.DoesntExist,
			frontmatterSource: { start: 0, end: 0 },
			scripts: [],
			styles: [],
			diagnostics: [
				{
					message:
						"The Astro compiler encountered an unknown error while transforming this file to TSX. Please create an issue with your code and the error shown in the server's logs: https://github.com/withastro/astro/issues",
					severity: 1,
					position: { start: 0, end: content.length },
				},
			],
			hasParseErrors: true,
		} satisfies ConvertToTsxResult;
	}
}

export function astro2tsx(input: string, fileName: string) {
	const tsx = safeConvertToTSX(input, fileName);

	return {
		virtualFile: getVirtualFileTSX(tsx),
		diagnostics: tsx.diagnostics,
	};
}

function getVirtualFileTSX(tsx: ConvertToTsxResult): VirtualCode {
	const code = tsx.code;
	const mapped = tsx.mappings
		.filter(([, generatedLength, , sourceLength]) => generatedLength > 0 && sourceLength > 0)
		.map(([generatedOffset, generatedLength, sourceOffset, sourceLength]) => ({
			generatedOffset,
			sourceOffset,
			length: Math.min(generatedLength, sourceLength),
		}));
	const mappings: CodeMapping[] = [];
	if (mapped.length > 0) {
		mappings.push({
			sourceOffsets: mapped.map(({ sourceOffset }) => sourceOffset),
			generatedOffsets: mapped.map(({ generatedOffset }) => generatedOffset),
			lengths: mapped.map(({ length }) => length),
			data: {
				verification: true,
				completion: true,
				semantic: true,
				navigation: true,
				structure: true,
				format: false,
			},
		});
	}
	for (const [
		generatedOffset,
		generatedLength,
		sourceOffset,
		sourceLength,
		kind,
		features,
	] of tsx.mappings) {
		if (
			generatedLength === 0 ||
			sourceLength !== 0 ||
			kind !== SPAN_MAP_KIND_ATOM ||
			features !== undefined
		) {
			continue;
		}

		const previous = [...mapped]
			.reverse()
			.find(
				(mapping) =>
					mapping.sourceOffset + mapping.length === sourceOffset &&
					mapping.generatedOffset + mapping.length <= generatedOffset,
			);
		if (!previous) continue;

		mappings.push({
			sourceOffsets: [previous.sourceOffset],
			generatedOffsets: [previous.generatedOffset],
			lengths: [previous.length],
			generatedLengths: [generatedOffset + generatedLength - previous.generatedOffset],
			data: { verification: true, navigation: true },
		});
	}
	if (tsx.frontmatterStatus === AstroFrontmatterStatus.DoesntExist) {
		mappings.push({
			sourceOffsets: [0],
			generatedOffsets: [tsx.frontmatter.start - 1],
			lengths: [0],
			generatedLengths: [1],
			data: { completion: true },
		});
	}

	return {
		id: 'tsx',
		languageId: 'typescriptreact',
		snapshot: {
			getText: (start, end) => code.substring(start, end),
			getLength: () => code.length,
			getChangeRange: () => undefined,
		},
		mappings,
		embeddedCodes: [],
	};
}

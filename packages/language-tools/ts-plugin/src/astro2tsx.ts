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

function usePublicComponentName(tsx: ConvertToTsxResult): ConvertToTsxResult {
	const range = tsx.generatedComponentExport;
	if (!range) return tsx;

	const exportStatement = tsx.code.slice(range.start, range.end);
	const exportMatch = /^export \{ (\S+) as (\S+) \};\n$/.exec(exportStatement);
	if (!exportMatch) return tsx;

	const [, generatedName, publicName] = exportMatch;
	if (generatedName === publicName) return tsx;

	const defaultExport = `export default function ${generatedName}`;
	const defaultExportStart = tsx.code.lastIndexOf(defaultExport);
	if (defaultExportStart === -1) return tsx;

	const replacements = [
		{
			start: defaultExportStart + 'export default function '.length,
			length: generatedName.length,
			text: publicName,
		},
		{
			start: range.start + exportStatement.indexOf(generatedName),
			length: generatedName.length,
			text: publicName,
		},
	].sort((a, b) => a.start - b.start);

	let code = tsx.code;
	for (const replacement of [...replacements].reverse()) {
		code =
			code.slice(0, replacement.start) +
			replacement.text +
			code.slice(replacement.start + replacement.length);
	}

	function mapOffset(offset: number) {
		let shift = 0;
		for (const replacement of replacements) {
			const end = replacement.start + replacement.length;
			if (offset < replacement.start) break;
			if (offset < end) {
				return (
					replacement.start + shift + Math.min(offset - replacement.start, replacement.text.length)
				);
			}
			shift += replacement.text.length - replacement.length;
		}
		return offset + shift;
	}

	return {
		...tsx,
		code,
		mappings: tsx.mappings.map(([generatedOffset, generatedLength, ...rest]) => {
			const start = mapOffset(generatedOffset);
			const end = mapOffset(generatedOffset + generatedLength);
			return [start, end - start, ...rest] as ConvertToTsxResult['mappings'][number];
		}),
		generatedComponentExport: {
			start: mapOffset(range.start),
			end: mapOffset(range.end),
		},
	};
}

export function astro2tsx(input: string, fileName: string) {
	const tsx = usePublicComponentName(safeConvertToTSX(input, fileName));

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

import type { TSXExtractedScript } from '@astrojs/compiler/types';
import type { CodeInformation, VirtualCode } from '@volar/language-core';
import { Segment, toString } from 'muggle-string';
import { buildMappings } from '../buildMappings';

export function extractScriptTags(scripts: TSXExtractedScript[]): VirtualCode[] {
	const embeddedJSCodes: VirtualCode[] = [];

	const moduleScripts = scripts
		.filter((script) => script.type === 'module' || script.type === 'processed-module')
		.map(moduleScriptToVirtualCode) satisfies VirtualCode[];

	const inlineScripts = scripts
		.filter((script) => script.type === 'event-attribute' || script.type === 'inline')
		.sort((a, b) => a.position.start - b.position.start);

	embeddedJSCodes.push(...moduleScripts);
	const mergedJSContext = mergeJSContexts(inlineScripts);
	if (mergedJSContext) {
		embeddedJSCodes.push(mergedJSContext);
	}

	return embeddedJSCodes;
}

function moduleScriptToVirtualCode(script: TSXExtractedScript, index: number): VirtualCode {
	let extension = 'mts';
	let languageId = 'typescript';
	if (script.type === 'module') {
		extension = 'mjs';
		languageId = 'javascript';
	}

	return {
		id: `${index}.${extension}`,
		languageId,
		snapshot: {
			getText: (start, end) => script.content.substring(start, end),
			getLength: () => script.content.length,
			getChangeRange: () => undefined,
		},
		mappings: [
			{
				sourceOffsets: [script.position.start],
				generatedOffsets: [0],
				lengths: [script.content.length],
				data: {
					verification: true,
					completion: true,
					semantic: true,
					navigation: true,
					structure: true,
					format: false,
				},
			},
		],
		embeddedCodes: [],
	};
}

/**
 * Merge all the inline and non-hoisted scripts into a single `.mjs` file
 */
function mergeJSContexts(inlineScripts: TSXExtractedScript[]): VirtualCode | undefined {
	if (inlineScripts.length === 0) {
		return undefined;
	}

	const codes: Segment<CodeInformation>[] = [];

	for (const javascriptContext of inlineScripts) {
		codes.push([
			// Add a semicolon to the end of the event attribute to attempt to prevent errors from spreading to the rest of the document
			// This is not perfect, but it's better than nothing
			// See: https://github.com/microsoft/vscode/blob/e8e04769ec817a3374c3eaa26a08d3ae491820d5/extensions/html-language-features/server/src/modes/embeddedSupport.ts#L192
			javascriptContext.content + ';',
			undefined,
			javascriptContext.position.start,
			{
				verification: true,
				completion: true,
				semantic: true,
				navigation: true,
				structure: true,
				format: false,
			},
		]);
	}

	const mappings = buildMappings(codes);
	const text = toString(codes);

	return {
		id: 'inline.mjs',
		languageId: 'javascript',
		snapshot: {
			getText: (start, end) => text.substring(start, end),
			getLength: () => text.length,
			getChangeRange: () => undefined,
		},
		embeddedCodes: [],
		mappings,
	};
}

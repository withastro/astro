'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.extractScriptTags = extractScriptTags;
const muggle_string_1 = require('muggle-string');
const buildMappings_1 = require('../buildMappings');
function extractScriptTags(scripts) {
	const embeddedJSCodes = [];
	const moduleScripts = scripts
		.filter((script) => script.type === 'module' || script.type === 'processed-module')
		.map(moduleScriptToVirtualCode);
	const inlineScripts = scripts
		.filter(
			(script) =>
				// TODO: Change this at some point so that unknown scripts are not included
				// We can't guarantee that they are JavaScript, so we shouldn't treat them as such, even if it might work in some cases
				// Perhaps we should make it so that the user has to specify the language of the script if it's not a known type (ex: lang="js"), not sure.
				script.type === 'event-attribute' || script.type === 'inline' || script.type === 'unknown',
		)
		.sort((a, b) => a.position.start - b.position.start);
	embeddedJSCodes.push(...moduleScripts);
	const mergedJSContext = mergeJSContexts(inlineScripts);
	if (mergedJSContext) {
		embeddedJSCodes.push(mergedJSContext);
	}
	const JSONScripts = scripts
		.filter((script) => script.type === 'json')
		.map(jsonScriptToVirtualCode);
	embeddedJSCodes.push(...JSONScripts);
	return embeddedJSCodes;
}
function moduleScriptToVirtualCode(script, index) {
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
function jsonScriptToVirtualCode(script, index) {
	return {
		id: `${index}.json`,
		languageId: 'json',
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
				// TODO: Support JSON features
				data: {
					verification: false,
					completion: false,
					semantic: false,
					navigation: false,
					structure: false,
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
function mergeJSContexts(inlineScripts) {
	if (inlineScripts.length === 0) {
		return undefined;
	}
	const codes = [];
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
	const mappings = (0, buildMappings_1.buildMappings)(codes);
	const text = (0, muggle_string_1.toString)(codes);
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
//# sourceMappingURL=parseJS.js.map

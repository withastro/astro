import type { ParentNode, ParseResult } from '@astrojs/compiler/types';
import { is } from '@astrojs/compiler/utils';
import { FileKind, FileRangeCapabilities, VirtualFile } from '@volar/language-core';
import * as SourceMap from '@volar/source-map';
import * as muggle from 'muggle-string';
import type ts from 'typescript/lib/tsserverlibrary';
import type { HTMLDocument, Node } from 'vscode-html-languageservice';

export function extractScriptTags(
	fileName: string,
	snapshot: ts.IScriptSnapshot,
	htmlDocument: HTMLDocument,
	ast: ParseResult['ast']
): VirtualFile[] {
	const embeddedJSFiles: VirtualFile[] = findIsolatedScripts(
		fileName,
		snapshot,
		htmlDocument.roots
	);

	const javascriptContexts = [
		...findInlineScripts(htmlDocument, snapshot),
		...findEventAttributes(ast),
	].sort((a, b) => a.startOffset - b.startOffset);

	if (javascriptContexts.length > 0) {
		embeddedJSFiles.push(mergeJSContexts(fileName, javascriptContexts));
	}

	return embeddedJSFiles;
}

function isIsolatedScriptTag(scriptTag: Node): boolean {
	// Using any kind of attributes on the script tag will disable hoisting
	if (
		!scriptTag.attributes ||
		(scriptTag.attributes && Object.entries(scriptTag.attributes).length === 0) ||
		scriptTag.attributes['type']?.includes('module')
	) {
		return true;
	}

	return false;
}

/**
 * Get all the isolated scripts in the HTML document
 * Isolated scripts are scripts that are hoisted by Astro and as such, are isolated from the rest of the code because of the implicit `type="module"`
 * All the isolated scripts are passed to the TypeScript language server as separate `.mts` files.
 */
function findIsolatedScripts(
	fileName: string,
	snapshot: ts.IScriptSnapshot,
	roots: Node[]
): VirtualFile[] {
	const embeddedScripts: VirtualFile[] = [];
	let scriptIndex = 0;

	getEmbeddedScriptsInNodes(roots);

	function getEmbeddedScriptsInNodes(nodes: Node[]) {
		for (const [_, node] of nodes.entries()) {
			if (
				node.tag === 'script' &&
				node.startTagEnd !== undefined &&
				node.endTagStart !== undefined &&
				isIsolatedScriptTag(node)
			) {
				const scriptText = snapshot.getText(node.startTagEnd, node.endTagStart);
				embeddedScripts.push({
					fileName: fileName + `.${scriptIndex}.mts`,
					kind: FileKind.TypeScriptHostFile,
					snapshot: {
						getText: (start, end) => scriptText.substring(start, end),
						getLength: () => scriptText.length,
						getChangeRange: () => undefined,
					},
					codegenStacks: [],
					mappings: [
						{
							sourceRange: [node.startTagEnd, node.endTagStart],
							generatedRange: [0, scriptText.length],
							data: FileRangeCapabilities.full,
						},
					],
					capabilities: {
						diagnostic: true,
						codeAction: true,
						inlayHint: true,
						documentSymbol: true,
						foldingRange: true,
						documentFormatting: false,
					},
					embeddedFiles: [],
				});
				scriptIndex++;
			}

			if (node.children) getEmbeddedScriptsInNodes(node.children);
		}
	}

	return embeddedScripts;
}

interface JavaScriptContext {
	content: string;
	startOffset: number;
}

/**
 * Get all the inline scripts in the HTML document
 * Inline scripts are scripts that are not hoisted by Astro and as such, are not isolated from the rest of the code.
 * All the inline scripts are concatenated into a single `.mjs` file and passed to the TypeScript language server.
 */
function findInlineScripts(
	htmlDocument: HTMLDocument,
	snapshot: ts.IScriptSnapshot
): JavaScriptContext[] {
	const inlineScripts: JavaScriptContext[] = [];

	getInlineScriptsInNodes(htmlDocument.roots);

	function getInlineScriptsInNodes(nodes: Node[]) {
		for (const [_, node] of nodes.entries()) {
			if (
				node.tag === 'script' &&
				node.startTagEnd !== undefined &&
				node.endTagStart !== undefined &&
				!isJSON(node.attributes?.type) &&
				!isIsolatedScriptTag(node)
			) {
				const scriptText = snapshot.getText(node.startTagEnd, node.endTagStart);
				inlineScripts.push({
					startOffset: node.startTagEnd,
					content: scriptText,
				});
			}

			if (node.children) getInlineScriptsInNodes(node.children);
		}
	}

	return inlineScripts;
}

/**
 * Include both MIME JSON types and `importmap` and `speculationrules` script types
 * See MIME Types -> https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
 * See Script Types -> https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type
 */
const JSON_TYPES = ['application/json', 'application/ld+json', 'importmap', 'speculationrules'];

/**
 * Check if the script has a type, and if it's included in JSON_TYPES above.
 * @param type Found in the `type` attribute of the script tag
 */
function isJSON(type: string | null | undefined): boolean {
	if (!type) return false;

	// HTML attributes are quoted, slice " and ' at the start and end of the string
	return JSON_TYPES.includes(type.slice(1, -1));
}

function findEventAttributes(ast: ParseResult['ast']): JavaScriptContext[] {
	const eventAttrs: JavaScriptContext[] = [];

	// `@astrojs/compiler`'s `walk` method is async, so we can't use it here. Arf
	function walkDown(parent: ParentNode) {
		if (!parent.children) return;

		parent.children.forEach((child) => {
			if (is.element(child)) {
				const eventAttribute = child.attributes.find(
					(attr) => htmlEventAttributes.includes(attr.name) && attr.kind === 'quoted'
				);

				if (eventAttribute && eventAttribute.position) {
					eventAttrs.push({
						content: eventAttribute.value,
						startOffset: eventAttribute.position.start.offset + `${eventAttribute.name}="`.length,
					});
				}
			}

			if (is.parent(child)) {
				walkDown(child);
			}
		});
	}

	walkDown(ast);

	return eventAttrs;
}

/**
 * Merge all the inline and non-hoisted scripts into a single `.mjs` file
 */
function mergeJSContexts(fileName: string, javascriptContexts: JavaScriptContext[]): VirtualFile {
	const codes: muggle.Segment<FileRangeCapabilities>[] = [];

	for (const javascriptContext of javascriptContexts) {
		codes.push([
			javascriptContext.content,
			undefined,
			javascriptContext.startOffset,
			FileRangeCapabilities.full,
		]);
	}

	const mappings = SourceMap.buildMappings(codes);
	const text = muggle.toString(codes);

	return {
		fileName: fileName + '.inline.mjs',
		codegenStacks: [],
		snapshot: {
			getText: (start, end) => text.substring(start, end),
			getLength: () => text.length,
			getChangeRange: () => undefined,
		},
		capabilities: {
			codeAction: true,
			diagnostic: true,
			documentFormatting: false,
			documentSymbol: true,
			foldingRange: true,
			inlayHint: true,
		},
		embeddedFiles: [],
		kind: FileKind.TypeScriptHostFile,
		mappings,
	};
}

const htmlEventAttributes = [
	'onabort',
	'onafterprint',
	'onauxclick',
	'onbeforematch',
	'onbeforeprint',
	'onbeforeunload',
	'onblur',
	'oncancel',
	'oncanplay',
	'oncanplaythrough',
	'onchange',
	'onclick',
	'onclose',
	'oncontextlost',
	'oncontextmenu',
	'oncontextrestored',
	'oncopy',
	'oncuechange',
	'oncut',
	'ondblclick',
	'ondrag',
	'ondragend',
	'ondragenter',
	'ondragleave',
	'ondragover',
	'ondragstart',
	'ondrop',
	'ondurationchange',
	'onemptied',
	'onended',
	'onerror',
	'onfocus',
	'onformdata',
	'onhashchange',
	'oninput',
	'oninvalid',
	'onkeydown',
	'onkeypress',
	'onkeyup',
	'onlanguagechange',
	'onload',
	'onloadeddata',
	'onloadedmetadata',
	'onloadstart',
	'onmessage',
	'onmessageerror',
	'onmousedown',
	'onmouseenter',
	'onmouseleave',
	'onmousemove',
	'onmouseout',
	'onmouseover',
	'onmouseup',
	'onoffline',
	'ononline',
	'onpagehide',
	'onpageshow',
	'onpaste',
	'onpause',
	'onplay',
	'onplaying',
	'onpopstate',
	'onprogress',
	'onratechange',
	'onrejectionhandled',
	'onreset',
	'onresize',
	'onscroll',
	'onscrollend',
	'onsecuritypolicyviolation',
	'onseeked',
	'onseeking',
	'onselect',
	'onslotchange',
	'onstalled',
	'onstorage',
	'onsubmit',
	'onsuspend',
	'ontimeupdate',
	'ontoggle',
	'onunhandledrejection',
	'onunload',
	'onvolumechange',
	'onwaiting',
	'onwheel',
];

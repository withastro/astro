import type { ParentNode, ParseResult } from '@astrojs/compiler/types';
import { is } from '@astrojs/compiler/utils';
import type { CodeInformation, VirtualCode } from '@volar/language-core';
import { Segment, toString } from 'muggle-string';
import type ts from 'typescript';
import type { HTMLDocument, Node } from 'vscode-html-languageservice';
import { buildMappings } from '../buildMappings';

export function extractScriptTags(
	snapshot: ts.IScriptSnapshot,
	htmlDocument: HTMLDocument,
	ast: ParseResult['ast']
): VirtualCode[] {
	const embeddedJSCodes: VirtualCode[] = findModuleScripts(snapshot, htmlDocument.roots);

	const javascriptContexts = [
		...findClassicScripts(htmlDocument, snapshot),
		...findEventAttributes(ast),
	].sort((a, b) => a.startOffset - b.startOffset);

	if (javascriptContexts.length > 0) {
		// classic scripts share the same scope
		// merging them brings about redeclaration errors
		embeddedJSCodes.push(mergeJSContexts(javascriptContexts));
	}

	return embeddedJSCodes;
}

function getScriptType(scriptTag: Node): 'classic' | 'module' | 'processed module' {
	// script tags without attributes are processed and converted into module scripts
	if (!scriptTag.attributes || Object.entries(scriptTag.attributes).length === 0)
		return 'processed module';
	// even when it is not processed by vite, scripts with type=module remain modules
	if (scriptTag.attributes['type']?.includes('module') === true) return 'module';
	// whenever there are attributes, is:inline is implied and in the absence of type=module, the script is classic
	return 'classic';
}

/**
 * Get all the isolated scripts in the HTML document
 * Isolated scripts are scripts that are hoisted by Astro and as such, are isolated from the rest of the code because of the implicit `type="module"`
 * All the isolated scripts are passed to the TypeScript language server as separate `.mts` files.
 */
function findModuleScripts(snapshot: ts.IScriptSnapshot, roots: Node[]): VirtualCode[] {
	const embeddedScripts: VirtualCode[] = [];
	let scriptIndex = 0;

	getEmbeddedScriptsInNodes(roots);

	function getEmbeddedScriptsInNodes(nodes: Node[]) {
		for (const [_, node] of nodes.entries()) {
			if (
				node.tag === 'script' &&
				node.startTagEnd !== undefined &&
				node.endTagStart !== undefined &&
				getScriptType(node) !== 'classic'
			) {
				const scriptText = snapshot.getText(node.startTagEnd, node.endTagStart);
				const extension = getScriptType(node) === 'processed module' ? 'mts' : 'mjs';
				const languageId = getScriptType(node) === 'processed module' ? 'typescript' : 'javascript';
				embeddedScripts.push({
					id: `${scriptIndex}.${extension}`,
					languageId: languageId,
					snapshot: {
						getText: (start, end) => scriptText.substring(start, end),
						getLength: () => scriptText.length,
						getChangeRange: () => undefined,
					},
					mappings: [
						{
							sourceOffsets: [node.startTagEnd],
							generatedOffsets: [0],
							lengths: [scriptText.length],
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
function findClassicScripts(
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
				getScriptType(node) === 'classic'
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
						// Add a semicolon to the end of the event attribute to attempt to prevent errors from spreading to the rest of the document
						// This is not perfect, but it's better than nothing
						// See: https://github.com/microsoft/vscode/blob/e8e04769ec817a3374c3eaa26a08d3ae491820d5/extensions/html-language-features/server/src/modes/embeddedSupport.ts#L192
						content: eventAttribute.value + ';',
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
function mergeJSContexts(javascriptContexts: JavaScriptContext[]): VirtualCode {
	const codes: Segment<CodeInformation>[] = [];

	for (const javascriptContext of javascriptContexts) {
		codes.push([
			javascriptContext.content,
			undefined,
			javascriptContext.startOffset,
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

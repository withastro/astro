import type { ParentNode, ParseResult } from '@astrojs/compiler/types';
import { is } from '@astrojs/compiler/utils';
import {
	FileCapabilities,
	FileKind,
	FileRangeCapabilities,
	VirtualFile,
} from '@volar/language-core';
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
	const embeddedJSFiles: VirtualFile['embeddedFiles'] = [];
	for (const [index, root] of htmlDocument.roots.entries()) {
		if (
			root.tag === 'script' &&
			root.startTagEnd !== undefined &&
			root.endTagStart !== undefined &&
			isIsolatedScriptTag(root)
		) {
			const scriptText = snapshot.getText(root.startTagEnd, root.endTagStart);

			embeddedJSFiles.push({
				fileName: fileName + `.${index}.mts`,
				kind: FileKind.TypeScriptHostFile,
				snapshot: {
					getText: (start, end) => scriptText.substring(start, end),
					getLength: () => scriptText.length,
					getChangeRange: () => undefined,
				},
				codegenStacks: [],
				mappings: [
					{
						sourceRange: [root.startTagEnd, root.endTagStart],
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
		}
	}

	const javascriptContexts = [
		...findInlineScripts(htmlDocument, snapshot),
		...findEventAttributes(ast),
	].sort((a, b) => a.startOffset - b.startOffset);

	if (javascriptContexts.length > 0) {
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

		embeddedJSFiles.push({
			fileName: fileName + '.inline.mjs',
			codegenStacks: [],
			snapshot: {
				getText: (start, end) => text.substring(start, end),
				getLength: () => text.length,
				getChangeRange: () => undefined,
			},
			capabilities: FileCapabilities.full,
			embeddedFiles: [],
			kind: FileKind.TypeScriptHostFile,
			mappings,
		});
	}

	return embeddedJSFiles;
}

interface JavaScriptContext {
	content: string;
	startOffset: number;
}

function findInlineScripts(
	htmlDocument: HTMLDocument,
	snapshot: ts.IScriptSnapshot
): JavaScriptContext[] {
	const inlineScripts: JavaScriptContext[] = [];
	for (const [_, root] of htmlDocument.roots.entries()) {
		if (
			root.tag === 'script' &&
			root.startTagEnd !== undefined &&
			root.endTagStart !== undefined &&
			!isIsolatedScriptTag(root)
		) {
			const scriptText = snapshot.getText(root.startTagEnd, root.endTagStart);
			inlineScripts.push({
				startOffset: root.startTagEnd,
				content: scriptText,
			});
		}
	}

	return inlineScripts;
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

export function isIsolatedScriptTag(scriptTag: Node): boolean {
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

export const htmlEventAttributes = [
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

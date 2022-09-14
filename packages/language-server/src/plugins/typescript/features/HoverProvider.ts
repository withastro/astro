import type ts from 'typescript';
import type { Hover, Position } from 'vscode-languageserver';
import { AstroDocument, mapObjWithRangeToOriginal } from '../../../core/documents';
import type { HoverProvider } from '../../interfaces';
import type { LanguageServiceManager } from '../LanguageServiceManager';
import { getMarkdownDocumentation } from '../previewer';
import type { AstroSnapshot } from '../snapshots/DocumentSnapshot';
import { convertRange, getScriptTagSnapshot, toVirtualAstroFilePath } from '../utils';

const partsMap = new Map([['JSX attribute', 'HTML attribute']]);

export class HoverProviderImpl implements HoverProvider {
	private ts: typeof import('typescript/lib/tsserverlibrary');

	constructor(private languageServiceManager: LanguageServiceManager) {
		this.ts = languageServiceManager.docContext.ts;
	}

	async doHover(document: AstroDocument, position: Position): Promise<Hover | null> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);
		const fragment = await tsDoc.createFragment();

		const offset = fragment.offsetAt(fragment.getGeneratedPosition(position));

		const html = document.html;
		const documentOffset = document.offsetAt(position);
		const node = html.findNodeAt(documentOffset);

		let info: ts.QuickInfo | undefined;

		if (node.tag === 'script') {
			const {
				snapshot: scriptTagSnapshot,
				filePath: scriptFilePath,
				offset: scriptOffset,
			} = getScriptTagSnapshot(tsDoc as AstroSnapshot, document, node, position);

			info = lang.getQuickInfoAtPosition(scriptFilePath, scriptOffset);

			if (info) {
				info.textSpan.start = fragment.offsetAt(
					scriptTagSnapshot.getOriginalPosition(scriptTagSnapshot.positionAt(info.textSpan.start))
				);
			}
		} else {
			info = lang.getQuickInfoAtPosition(tsDoc.filePath, offset);
		}

		if (!info) {
			return null;
		}

		const textSpan = info.textSpan;

		const displayParts: ts.SymbolDisplayPart[] = (info.displayParts || []).map((value) => ({
			text: partsMap.has(value.text) ? partsMap.get(value.text)! : value.text,
			kind: value.kind,
		}));
		const declaration = this.ts.displayPartsToString(displayParts);
		const documentation = getMarkdownDocumentation(info.documentation, info.tags, this.ts);

		// https://microsoft.github.io/language-server-protocol/specification#textDocument_hover
		const contents = ['```typescript', declaration, '```']
			.concat(documentation ? ['---', documentation] : [])
			.join('\n');

		return mapObjWithRangeToOriginal(fragment, {
			range: convertRange(fragment, textSpan),
			contents,
		});
	}
}

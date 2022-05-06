import ts from 'typescript';
import { FoldingRange, FoldingRangeKind, Position } from 'vscode-languageserver';
import { AstroDocument } from '../../../core/documents';
import { FoldingRangesProvider } from '../../interfaces';
import { LanguageServiceManager } from '../LanguageServiceManager';
import { AstroSnapshot } from '../snapshots/DocumentSnapshot';
import { getScriptTagSnapshot, toVirtualAstroFilePath } from '../utils';

export class FoldingRangesProviderImpl implements FoldingRangesProvider {
	constructor(private readonly languageServiceManager: LanguageServiceManager) {}

	async getFoldingRanges(document: AstroDocument): Promise<FoldingRange[] | null> {
		const html = document.html;
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);

		const filePath = toVirtualAstroFilePath(tsDoc.filePath);

		const outliningSpans = lang.getOutliningSpans(filePath).filter((span) => {
			const node = html.findNodeAt(span.textSpan.start);

			// Due to how our TSX output transform those tags into function calls or template literals
			// TypeScript thinks of those as outlining spans, which is fine but we don't want folding ranges for those
			return node.tag !== 'script' && node.tag !== 'style' && node.tag !== 'Markdown';
		});

		const scriptOutliningSpans: ts.OutliningSpan[] = [];

		document.scriptTags.forEach((scriptTag) => {
			const { snapshot: scriptTagSnapshot, filePath: scriptFilePath } = getScriptTagSnapshot(
				tsDoc as AstroSnapshot,
				document,
				scriptTag.container
			);

			scriptOutliningSpans.push(
				...lang.getOutliningSpans(scriptFilePath).map((span) => {
					span.textSpan.start = document.offsetAt(
						scriptTagSnapshot.getOriginalPosition(scriptTagSnapshot.positionAt(span.textSpan.start))
					);

					return span;
				})
			);
		});

		const foldingRanges: FoldingRange[] = [];

		for (const span of [...outliningSpans, ...scriptOutliningSpans]) {
			const start = document.positionAt(span.textSpan.start);
			const end = adjustFoldingEnd(start, document.positionAt(span.textSpan.start + span.textSpan.length), document);

			// When using this method for generating folding ranges, TypeScript tend to return some
			// one line / one character ones that we should be able to safely ignore
			if (start.line === end.line && start.character === end.character) {
				continue;
			}

			foldingRanges.push(
				FoldingRange.create(start.line, end.line, start.character, end.character, transformFoldingRangeKind(span.kind))
			);
		}

		return foldingRanges;
	}
}

function transformFoldingRangeKind(tsKind: ts.OutliningSpanKind) {
	switch (tsKind) {
		case ts.OutliningSpanKind.Comment:
			return FoldingRangeKind.Comment;
		case ts.OutliningSpanKind.Imports:
			return FoldingRangeKind.Imports;
		case ts.OutliningSpanKind.Region:
			return FoldingRangeKind.Region;
	}
}

// https://github.com/microsoft/vscode/blob/bed61166fb604e519e82e4d1d1ed839bc45d65f8/extensions/typescript-language-features/src/languageFeatures/folding.ts#L61-L73
function adjustFoldingEnd(start: Position, end: Position, document: AstroDocument) {
	// workaround for #47240
	if (end.character > 0) {
		const foldEndCharacter = document.getText({
			start: { line: end.line, character: end.character - 1 },
			end,
		});
		if (['}', ']', ')', '`'].includes(foldEndCharacter)) {
			const endOffset = Math.max(document.offsetAt({ line: end.line, character: 0 }) - 1, document.offsetAt(start));
			return document.positionAt(endOffset);
		}
	}

	return end;
}

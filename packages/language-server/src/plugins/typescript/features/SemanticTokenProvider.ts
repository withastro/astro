import { CancellationToken, Range, SemanticTokens, SemanticTokensBuilder } from 'vscode-languageserver';
import { AstroDocument, mapRangeToOriginal } from '../../../core/documents';
import type { SemanticTokensProvider } from '../../interfaces';
import type { LanguageServiceManager } from '../LanguageServiceManager';
import type { DocumentSnapshot } from '../snapshots/DocumentSnapshot';

export class SemanticTokensProviderImpl implements SemanticTokensProvider {
	private ts: typeof import('typescript/lib/tsserverlibrary');

	constructor(private languageServiceManager: LanguageServiceManager) {
		this.ts = languageServiceManager.docContext.ts;
	}

	async getSemanticTokens(
		document: AstroDocument,
		range?: Range,
		cancellationToken?: CancellationToken
	): Promise<SemanticTokens | null> {
		const { lang, tsDoc } = await this.languageServiceManager.getLSAndTSDoc(document);

		if (cancellationToken?.isCancellationRequested) {
			return null;
		}

		const start = range ? tsDoc.offsetAt(tsDoc.getGeneratedPosition(range.start)) : 0;

		const { spans } = lang.getEncodedSemanticClassifications(
			tsDoc.filePath,
			{
				start,
				length: range
					? tsDoc.offsetAt(tsDoc.getGeneratedPosition(range.end)) - start
					: // We don't want tokens for things added by astro2tsx
					  tsDoc.getFullText().lastIndexOf('export default function ') || tsDoc.getLength(),
			},
			this.ts.SemanticClassificationFormat.TwentyTwenty
		);

		const tokens: [number, number, number, number, number][] = [];

		let i = 0;
		while (i < spans.length) {
			const offset = spans[i++];
			const generatedLength = spans[i++];
			const classification = spans[i++];

			const originalPosition = this.mapToOrigin(document, tsDoc, offset, generatedLength);
			if (!originalPosition) {
				continue;
			}

			const [line, character, length] = originalPosition;

			const classificationType = this.getTokenTypeFromClassification(classification);
			if (classificationType < 0) {
				continue;
			}

			const modifier = this.getTokenModifierFromClassification(classification);

			tokens.push([line, character, length, classificationType, modifier]);
		}

		const sorted = tokens.sort((a, b) => {
			const [lineA, charA] = a;
			const [lineB, charB] = b;

			return lineA - lineB || charA - charB;
		});

		const builder = new SemanticTokensBuilder();
		sorted.forEach((tokenData) => builder.push(...tokenData));
		const build = builder.build();

		return build;
	}

	private mapToOrigin(
		document: AstroDocument,
		snapshot: DocumentSnapshot,
		generatedOffset: number,
		generatedLength: number
	): [line: number, character: number, length: number, start: number] | undefined {
		const range = {
			start: snapshot.positionAt(generatedOffset),
			end: snapshot.positionAt(generatedOffset + generatedLength),
		};
		const { start: startPosition, end: endPosition } = mapRangeToOriginal(snapshot, range);

		if (startPosition.line < 0 || endPosition.line < 0) {
			return;
		}

		const startOffset = document.offsetAt(startPosition);
		const endOffset = document.offsetAt(endPosition);

		return [startPosition.line, startPosition.character, endOffset - startOffset, startOffset];
	}

	/**
	 *  TSClassification = (TokenType + 1) << TokenEncodingConsts.typeOffset + TokenModifier
	 */
	private getTokenTypeFromClassification(tsClassification: number): number {
		return (tsClassification >> TokenEncodingConsts.typeOffset) - 1;
	}

	private getTokenModifierFromClassification(tsClassification: number) {
		return tsClassification & TokenEncodingConsts.modifierMask;
	}
}

const enum TokenEncodingConsts {
	typeOffset = 8,
	modifierMask = 255,
}

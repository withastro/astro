import { CancellationToken, Range, SemanticTokens, SemanticTokensBuilder } from 'vscode-languageserver';
import { AstroDocument, mapRangeToOriginal } from '../../../core/documents';
import type { SemanticTokensProvider } from '../../interfaces';
import type { LanguageServiceManager } from '../LanguageServiceManager';
import type { AstroSnapshotFragment } from '../snapshots/DocumentSnapshot';
import { toVirtualAstroFilePath } from '../utils';

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
		const fragment = (await tsDoc.createFragment()) as AstroSnapshotFragment;

		if (cancellationToken?.isCancellationRequested) {
			return null;
		}

		const filePath = toVirtualAstroFilePath(tsDoc.filePath);
		const start = range ? fragment.offsetAt(fragment.getGeneratedPosition(range.start)) : 0;

		const { spans } = lang.getEncodedSemanticClassifications(
			filePath,
			{
				start,
				length: range
					? fragment.offsetAt(fragment.getGeneratedPosition(range.end)) - start
					: // We don't want tokens for things added by astro2tsx
					  fragment.text.lastIndexOf('export default function ') || fragment.text.length,
			},
			this.ts.SemanticClassificationFormat.TwentyTwenty
		);

		const tokens: [number, number, number, number, number][] = [];

		let i = 0;
		while (i < spans.length) {
			const offset = spans[i++];
			const generatedLength = spans[i++];
			const classification = spans[i++];

			const originalPosition = this.mapToOrigin(document, fragment, offset, generatedLength);
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
		fragment: AstroSnapshotFragment,
		generatedOffset: number,
		generatedLength: number
	): [line: number, character: number, length: number, start: number] | undefined {
		const range = {
			start: fragment.positionAt(generatedOffset),
			end: fragment.positionAt(generatedOffset + generatedLength),
		};
		const { start: startPosition, end: endPosition } = mapRangeToOriginal(fragment, range);

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

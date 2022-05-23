import ts from 'typescript';
import {
    CancellationToken,
    Range,
    SemanticTokens,
    SemanticTokensBuilder
} from 'vscode-languageserver';
import { Document, mapRangeToOriginal } from '../../../lib/documents';
import { SemanticTokensProvider } from '../../interfaces';
import { SvelteSnapshotFragment } from '../DocumentSnapshot';
import { LSAndTSDocResolver } from '../LSAndTSDocResolver';
import { convertToTextSpan } from '../utils';
import { isInGeneratedCode } from './utils';

const CONTENT_LENGTH_LIMIT = 50000;

export class SemanticTokensProviderImpl implements SemanticTokensProvider {
    constructor(private readonly lsAndTsDocResolver: LSAndTSDocResolver) {}

    async getSemanticTokens(
        textDocument: Document,
        range?: Range,
        cancellationToken?: CancellationToken
    ): Promise<SemanticTokens | null> {
        const { lang, tsDoc } = await this.lsAndTsDocResolver.getLSAndTSDoc(textDocument);
        const fragment = tsDoc.getFragment();

        // for better performance, don't do full-file semantic tokens when the file is too big
        if (
            (!range && fragment.text.length > CONTENT_LENGTH_LIMIT) ||
            cancellationToken?.isCancellationRequested
        ) {
            return null;
        }

        // No script tags -> nothing to analyse semantic tokens for
        if (!textDocument.scriptInfo && !textDocument.moduleScriptInfo) {
            return null;
        }

        const textSpan = range
            ? convertToTextSpan(range, fragment)
            : {
                  start: 0,
                  length: tsDoc.parserError
                      ? fragment.text.length
                      : // This is appended by svelte2tsx, there's nothing mappable afterwards
                        fragment.text.lastIndexOf('return { props:') || fragment.text.length
              };

        const { spans } = lang.getEncodedSemanticClassifications(
            tsDoc.filePath,
            textSpan,
            ts.SemanticClassificationFormat.TwentyTwenty
        );

        const data: Array<[number, number, number, number, number]> = [];
        let index = 0;

        while (index < spans.length) {
            // [start, length, encodedClassification, start2, length2, encodedClassification2]
            const generatedOffset = spans[index++];
            const generatedLength = spans[index++];
            const encodedClassification = spans[index++];
            const classificationType = this.getTokenTypeFromClassification(encodedClassification);
            if (classificationType < 0) {
                continue;
            }

            const originalPosition = this.mapToOrigin(
                textDocument,
                fragment,
                generatedOffset,
                generatedLength
            );
            if (!originalPosition) {
                continue;
            }

            const [line, character, length] = originalPosition;

            // remove identifiers whose start and end mapped to the same location,
            // like the svelte2tsx inserted render function,
            // or reversed like Component.$on
            if (length <= 0) {
                continue;
            }

            const modifier = this.getTokenModifierFromClassification(encodedClassification);

            data.push([line, character, length, classificationType, modifier]);
        }

        const sorted = data.sort((a, b) => {
            const [lineA, charA] = a;
            const [lineB, charB] = b;

            return lineA - lineB || charA - charB;
        });

        const builder = new SemanticTokensBuilder();
        sorted.forEach((tokenData) => builder.push(...tokenData));
        return builder.build();
    }

    private mapToOrigin(
        document: Document,
        fragment: SvelteSnapshotFragment,
        generatedOffset: number,
        generatedLength: number
    ): [line: number, character: number, length: number, start: number] | undefined {
        if (isInGeneratedCode(fragment.text, generatedOffset, generatedOffset + generatedLength)) {
            return;
        }

        const range = {
            start: fragment.positionAt(generatedOffset),
            end: fragment.positionAt(generatedOffset + generatedLength)
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
    modifierMask = (1 << typeOffset) - 1
}

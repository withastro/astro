import ts from 'typescript';
import { Location, Position, ReferenceContext } from 'vscode-languageserver';
import { Document } from '../../../lib/documents';
import { pathToUrl } from '../../../utils';
import { FindReferencesProvider } from '../../interfaces';
import { LSAndTSDocResolver } from '../LSAndTSDocResolver';
import { convertToLocationRange, hasNonZeroRange } from '../utils';
import { isNoTextSpanInGeneratedCode, SnapshotFragmentMap } from './utils';

export class FindReferencesProviderImpl implements FindReferencesProvider {
    constructor(private readonly lsAndTsDocResolver: LSAndTSDocResolver) {}

    async findReferences(
        document: Document,
        position: Position,
        context: ReferenceContext
    ): Promise<Location[] | null> {
        const { lang, tsDoc } = await this.getLSAndTSDoc(document);
        const fragment = tsDoc.getFragment();

        const references = lang.getReferencesAtPosition(
            tsDoc.filePath,
            fragment.offsetAt(fragment.getGeneratedPosition(position))
        );
        if (!references) {
            return null;
        }

        const docs = new SnapshotFragmentMap(this.lsAndTsDocResolver);
        docs.set(tsDoc.filePath, { fragment, snapshot: tsDoc });

        const locations = await Promise.all(
            references
                .filter((ref) => context.includeDeclaration || !ref.isDefinition)
                .filter(notInGeneratedCode(tsDoc.getFullText()))
                .map(async (ref) => {
                    const defDoc = await docs.retrieveFragment(ref.fileName);

                    return Location.create(
                        pathToUrl(ref.fileName),
                        convertToLocationRange(defDoc, ref.textSpan)
                    );
                })
        );
        // Some references are in generated code but not wrapped with explicit ignore comments.
        // These show up as zero-length ranges, so filter them out.
        return locations.filter(hasNonZeroRange);
    }

    private async getLSAndTSDoc(document: Document) {
        return this.lsAndTsDocResolver.getLSAndTSDoc(document);
    }
}

function notInGeneratedCode(text: string) {
    return (ref: ts.ReferenceEntry) => {
        return isNoTextSpanInGeneratedCode(text, ref.textSpan);
    };
}

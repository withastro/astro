import { Position, Location } from 'vscode-languageserver-protocol';
import { Document, mapRangeToOriginal } from '../../../lib/documents';
import { pathToUrl, isNotNullOrUndefined } from '../../../utils';
import { ImplementationProvider } from '../../interfaces';
import { LSAndTSDocResolver } from '../LSAndTSDocResolver';
import { convertRange } from '../utils';
import { isNoTextSpanInGeneratedCode, SnapshotFragmentMap } from './utils';

export class ImplementationProviderImpl implements ImplementationProvider {
    constructor(private readonly lsAndTsDocResolver: LSAndTSDocResolver) {}

    async getImplementation(document: Document, position: Position): Promise<Location[] | null> {
        const { tsDoc, lang } = await this.lsAndTsDocResolver.getLSAndTSDoc(document);

        const mainFragment = tsDoc.getFragment();
        const offset = mainFragment.offsetAt(mainFragment.getGeneratedPosition(position));

        const implementations = lang.getImplementationAtPosition(tsDoc.filePath, offset);

        const docs = new SnapshotFragmentMap(this.lsAndTsDocResolver);
        docs.set(tsDoc.filePath, { fragment: mainFragment, snapshot: tsDoc });

        if (!implementations) {
            return null;
        }

        const result = await Promise.all(
            implementations.map(async (implementation) => {
                const { fragment, snapshot } = await docs.retrieve(implementation.fileName);

                if (!isNoTextSpanInGeneratedCode(snapshot.getFullText(), implementation.textSpan)) {
                    return;
                }

                const range = mapRangeToOriginal(
                    fragment,
                    convertRange(fragment, implementation.textSpan)
                );

                if (range.start.line >= 0 && range.end.line >= 0) {
                    return Location.create(pathToUrl(implementation.fileName), range);
                }
            })
        );

        return result.filter(isNotNullOrUndefined);
    }
}

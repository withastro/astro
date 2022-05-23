import { Position, Location } from 'vscode-languageserver-protocol';
import { Document, mapRangeToOriginal } from '../../../lib/documents';
import { pathToUrl, isNotNullOrUndefined } from '../../../utils';
import { TypeDefinitionProvider } from '../../interfaces';
import { LSAndTSDocResolver } from '../LSAndTSDocResolver';
import { convertRange } from '../utils';
import { isNoTextSpanInGeneratedCode, SnapshotFragmentMap } from './utils';

export class TypeDefinitionProviderImpl implements TypeDefinitionProvider {
    constructor(private readonly lsAndTsDocResolver: LSAndTSDocResolver) {}

    async getTypeDefinition(document: Document, position: Position): Promise<Location[] | null> {
        const { tsDoc, lang } = await this.lsAndTsDocResolver.getLSAndTSDoc(document);

        const mainFragment = tsDoc.getFragment();
        const offset = mainFragment.offsetAt(mainFragment.getGeneratedPosition(position));

        const typeDefs = lang.getTypeDefinitionAtPosition(tsDoc.filePath, offset);

        const docs = new SnapshotFragmentMap(this.lsAndTsDocResolver);
        docs.set(tsDoc.filePath, { fragment: mainFragment, snapshot: tsDoc });

        if (!typeDefs) {
            return null;
        }

        const result = await Promise.all(
            typeDefs.map(async (typeDef) => {
                const { fragment, snapshot } = await docs.retrieve(typeDef.fileName);

                if (!isNoTextSpanInGeneratedCode(snapshot.getFullText(), typeDef.textSpan)) {
                    return;
                }

                const range = mapRangeToOriginal(
                    fragment,
                    convertRange(fragment, typeDef.textSpan)
                );

                if (range.start.line >= 0 && range.end.line >= 0) {
                    return Location.create(pathToUrl(typeDef.fileName), range);
                }
            })
        );

        return result.filter(isNotNullOrUndefined);
    }
}

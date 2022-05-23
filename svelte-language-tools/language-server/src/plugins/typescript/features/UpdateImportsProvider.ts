import {
    OptionalVersionedTextDocumentIdentifier,
    TextDocumentEdit,
    TextEdit,
    WorkspaceEdit
} from 'vscode-languageserver';
import { mapRangeToOriginal } from '../../../lib/documents';
import { urlToPath } from '../../../utils';
import { FileRename, UpdateImportsProvider } from '../../interfaces';
import { LSAndTSDocResolver } from '../LSAndTSDocResolver';
import { convertRange } from '../utils';
import { SnapshotFragmentMap } from './utils';

export class UpdateImportsProviderImpl implements UpdateImportsProvider {
    constructor(private readonly lsAndTsDocResolver: LSAndTSDocResolver) {}

    async updateImports(fileRename: FileRename): Promise<WorkspaceEdit | null> {
        // TODO does this handle folder moves/renames correctly? old/new path isn't a file then
        const oldPath = urlToPath(fileRename.oldUri);
        const newPath = urlToPath(fileRename.newUri);
        if (!oldPath || !newPath) {
            return null;
        }

        const ls = await this.getLSForPath(newPath);
        // `getEditsForFileRename` might take a while
        const fileChanges = ls.getEditsForFileRename(oldPath, newPath, {}, {});

        await this.lsAndTsDocResolver.updateSnapshotPath(oldPath, newPath);
        const updateImportsChanges = fileChanges
            // Assumption: Updating imports will not create new files, and to make sure just filter those out
            // who - for whatever reason - might be new ones.
            .filter((change) => !change.isNewFile || change.fileName === oldPath)
            // The language service might want to do edits to the old path, not the new path -> rewire it.
            // If there is a better solution for this, please file a PR :)
            .map((change) => {
                change.fileName = change.fileName.replace(oldPath, newPath);
                return change;
            });

        const docs = new SnapshotFragmentMap(this.lsAndTsDocResolver);
        const documentChanges = await Promise.all(
            updateImportsChanges.map(async (change) => {
                const fragment = await docs.retrieveFragment(change.fileName);

                return TextDocumentEdit.create(
                    OptionalVersionedTextDocumentIdentifier.create(fragment.getURL(), null),
                    change.textChanges.map((edit) => {
                        const range = mapRangeToOriginal(
                            fragment,
                            convertRange(fragment, edit.span)
                        );
                        return TextEdit.replace(range, edit.newText);
                    })
                );
            })
        );

        return { documentChanges };
    }

    private async getLSForPath(path: string) {
        return this.lsAndTsDocResolver.getLSForPath(path);
    }
}

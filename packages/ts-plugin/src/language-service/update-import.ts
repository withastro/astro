import type ts from 'typescript/lib/tsserverlibrary';
import { Logger } from '../logger';
import { AstroSnapshotManager } from '../astro-snapshots';
import { isAstroFilePath } from '../utils';

export function decorateUpdateImports(
    ls: ts.LanguageService,
    snapshotManager: AstroSnapshotManager,
    logger: Logger
): void {
    const getEditsForFileRename = ls.getEditsForFileRename;
    ls.getEditsForFileRename = (oldFilePath, newFilePath, formatOptions, preferences) => {
        const renameLocations = getEditsForFileRename(
            oldFilePath,
            newFilePath,
            formatOptions,
            preferences
        );
        // If a file move/rename of a TS/JS file results a Astro file change,
        // the Astro extension will notice that, too, and adjusts the same imports.
        // This results in duplicate adjustments or race conditions with conflicting text spans
        // which can break imports in some cases.
        // Therefore don't do any updates of Astro files and and also no updates of mixed TS files
        // and let the Astro extension handle that.
        return renameLocations?.filter((renameLocation) => {
            return (
                !isAstroFilePath(renameLocation.fileName) &&
                !renameLocation.textChanges.some((change) => change.newText.endsWith('.astro'))
            );
        });
    };
}
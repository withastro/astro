import type ts from 'typescript/lib/tsserverlibrary';
import { Logger } from '../logger';
import { SvelteSnapshotManager } from '../svelte-snapshots';
import { isNotNullOrUndefined, isSvelteFilePath } from '../utils';

export function decorateFindReferences(
    ls: ts.LanguageService,
    snapshotManager: SvelteSnapshotManager,
    logger: Logger
): void {
    decorateGetReferencesAtPosition(ls, snapshotManager, logger);
    _decorateFindReferences(ls, snapshotManager, logger);
}

function _decorateFindReferences(
    ls: ts.LanguageService,
    snapshotManager: SvelteSnapshotManager,
    logger: Logger
) {
    const findReferences = ls.findReferences;
    ls.findReferences = (fileName, position) => {
        const references = findReferences(fileName, position);
        return references
            ?.map((reference) => {
                const snapshot = snapshotManager.get(reference.definition.fileName);
                if (!isSvelteFilePath(reference.definition.fileName) || !snapshot) {
                    return {
                        ...reference,
                        references: mapReferences(reference.references, snapshotManager, logger)
                    };
                }

                const textSpan = snapshot.getOriginalTextSpan(reference.definition.textSpan);
                if (!textSpan) {
                    return null;
                }

                return {
                    definition: {
                        ...reference.definition,
                        textSpan,
                        // Spare the work for now
                        originalTextSpan: undefined
                    },
                    references: mapReferences(reference.references, snapshotManager, logger)
                };
            })
            .filter(isNotNullOrUndefined);
    };
}

function decorateGetReferencesAtPosition(
    ls: ts.LanguageService,
    snapshotManager: SvelteSnapshotManager,
    logger: Logger
) {
    const getReferencesAtPosition = ls.getReferencesAtPosition;
    ls.getReferencesAtPosition = (fileName, position) => {
        const references = getReferencesAtPosition(fileName, position);
        return references && mapReferences(references, snapshotManager, logger);
    };
}

function mapReferences(
    references: ts.ReferenceEntry[],
    snapshotManager: SvelteSnapshotManager,
    logger: Logger
): ts.ReferenceEntry[] {
    return references
        .map((reference) => {
            const snapshot = snapshotManager.get(reference.fileName);
            if (!isSvelteFilePath(reference.fileName) || !snapshot) {
                return reference;
            }

            const textSpan = snapshot.getOriginalTextSpan(reference.textSpan);
            if (!textSpan) {
                return null;
            }

            logger.debug(
                'Find references; map textSpan: changed',
                reference.textSpan,
                'to',
                textSpan
            );

            return {
                ...reference,
                textSpan,
                // Spare the work for now
                contextSpan: undefined,
                originalTextSpan: undefined,
                originalContextSpan: undefined
            };
        })
        .filter(isNotNullOrUndefined);
}

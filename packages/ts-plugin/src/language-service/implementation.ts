import type ts from 'typescript/lib/tsserverlibrary';
import { Logger } from '../logger.js';
import { AstroSnapshotManager } from '../astro-snapshots.js';
import { isNotNullOrUndefined, isAstroFilePath } from '../utils.js';

export function decorateGetImplementation(
    ls: ts.LanguageService,
    snapshotManager: AstroSnapshotManager,
    logger: Logger
): void {
    const getImplementationAtPosition = ls.getImplementationAtPosition;
    ls.getImplementationAtPosition = (fileName, position) => {
        const implementation = getImplementationAtPosition(fileName, position);
        return implementation
            ?.map((impl) => {
                if (!isAstroFilePath(impl.fileName)) {
                    return impl;
                }

                const textSpan = snapshotManager
                    .get(impl.fileName)
                    ?.getOriginalTextSpan(impl.textSpan);
                if (!textSpan) {
                    return undefined;
                }

                return {
                    ...impl,
                    textSpan,
                    // Spare the work for now
                    contextSpan: undefined,
                    originalTextSpan: undefined,
                    originalContextSpan: undefined
                };
            })
            .filter(isNotNullOrUndefined);
    };
}
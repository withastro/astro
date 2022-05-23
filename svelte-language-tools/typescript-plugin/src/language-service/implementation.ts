import type ts from 'typescript/lib/tsserverlibrary';
import { Logger } from '../logger';
import { SvelteSnapshotManager } from '../svelte-snapshots';
import { isNotNullOrUndefined, isSvelteFilePath } from '../utils';

export function decorateGetImplementation(
    ls: ts.LanguageService,
    snapshotManager: SvelteSnapshotManager,
    logger: Logger
): void {
    const getImplementationAtPosition = ls.getImplementationAtPosition;
    ls.getImplementationAtPosition = (fileName, position) => {
        const implementation = getImplementationAtPosition(fileName, position);
        return implementation
            ?.map((impl) => {
                if (!isSvelteFilePath(impl.fileName)) {
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

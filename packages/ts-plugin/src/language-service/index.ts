import type ts from 'typescript/lib/tsserverlibrary';
import { Logger } from '../logger';
import { AstroSnapshotManager } from '../astro-snapshots.js';
import { isAstroFilePath } from '../utils.js';
import { decorateCompletions } from './completions.js';
import { decorateGetDefinition } from './definition.js';
import { decorateDiagnostics } from './diagnostics.js';
import { decorateFindReferences } from './find-references.js';
import { decorateGetImplementation } from './implementation.js';
import { decorateRename } from './rename.js';
import { decorateUpdateImports } from './update-import';

export function decorateLanguageService(
    ls: ts.LanguageService,
    snapshotManager: AstroSnapshotManager,
    logger: Logger
) {
    // Decorate using a proxy so we can dynamically enable/disable method
    // patches depending on the enabled state of our config
    const proxy = new Proxy(ls, createProxyHandler());
    decorateLanguageServiceInner(proxy, snapshotManager, logger);
    return proxy;
}

export function decorateLanguageServiceInner(
    ls: ts.LanguageService,
    snapshotManager: AstroSnapshotManager,
    logger: Logger
): ts.LanguageService {
    patchLineColumnOffset(ls, snapshotManager);
    decorateRename(ls, snapshotManager, logger);
    decorateDiagnostics(ls, logger);
    decorateFindReferences(ls, snapshotManager, logger);
    decorateCompletions(ls, logger);
    decorateGetDefinition(ls, snapshotManager, logger);
    decorateGetImplementation(ls, snapshotManager, logger);
    decorateUpdateImports(ls, snapshotManager, logger);
    return ls;
}

const astroPluginPatchSymbol = Symbol('astroPluginPatchSymbol');

export function isPatched(ls: ts.LanguageService) {
    return (ls as any)[astroPluginPatchSymbol] === true;
}

function createProxyHandler(): ProxyHandler<ts.LanguageService> {
    const decorated: Partial<ts.LanguageService> = {};

    return {
        get(target, p) {
            // always return patch symbol whether the plugin is enabled or not
            if (p === astroPluginPatchSymbol) 
                return true;

            if (p === 'dispose') 
                return target[p as keyof ts.LanguageService];

            return (
                decorated[p as keyof ts.LanguageService] ?? target[p as keyof ts.LanguageService]
            );
        },
        set(_, p, value) {
            decorated[p as keyof ts.LanguageService] = value;

            return true;
        }
    };
}

function patchLineColumnOffset(ls: ts.LanguageService, snapshotManager: AstroSnapshotManager) {
    if (!ls.toLineColumnOffset) {
        return;
    }

    // We need to patch this because (according to source, only) getDefinition uses this
    const toLineColumnOffset = ls.toLineColumnOffset;
    ls.toLineColumnOffset = (fileName, position) => {
        if (isAstroFilePath(fileName)) {
            const snapshot = snapshotManager.get(fileName);
            if (snapshot) {
                return snapshot.positionAt(position);
            }
        }
        return toLineColumnOffset(fileName, position);
    };
}
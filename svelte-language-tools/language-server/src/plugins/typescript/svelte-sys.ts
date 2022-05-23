import { DocumentSnapshot } from './DocumentSnapshot';
import ts from 'typescript';
import { ensureRealSvelteFilePath, isVirtualSvelteFilePath, toRealSvelteFilePath } from './utils';

/**
 * This should only be accessed by TS svelte module resolution.
 */
export function createSvelteSys(getSnapshot: (fileName: string) => DocumentSnapshot) {
    const fileExistsCache = new Map<string, boolean>();

    const svelteSys: ts.System & { deleteFromCache: (path: string) => void } = {
        ...ts.sys,
        fileExists(path: string) {
            path = ensureRealSvelteFilePath(path);
            const exists = fileExistsCache.get(path) ?? ts.sys.fileExists(path);
            fileExistsCache.set(path, exists);
            return exists;
        },
        readFile(path: string) {
            const snapshot = getSnapshot(path);
            return snapshot.getText(0, snapshot.getLength());
        },
        readDirectory(path, extensions, exclude, include, depth) {
            const extensionsWithSvelte = (extensions ?? []).concat('.svelte');

            return ts.sys.readDirectory(path, extensionsWithSvelte, exclude, include, depth);
        },
        deleteFile(path) {
            fileExistsCache.delete(ensureRealSvelteFilePath(path));
            return ts.sys.deleteFile?.(path);
        },
        deleteFromCache(path) {
            fileExistsCache.delete(ensureRealSvelteFilePath(path));
        }
    };

    if (ts.sys.realpath) {
        const realpath = ts.sys.realpath;
        svelteSys.realpath = function (path) {
            if (isVirtualSvelteFilePath(path)) {
                return realpath(toRealSvelteFilePath(path)) + '.ts';
            }
            return realpath(path);
        };
    }

    return svelteSys;
}

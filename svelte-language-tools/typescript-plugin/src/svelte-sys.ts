import ts from 'typescript';
import { Logger } from './logger';
import { ensureRealSvelteFilePath, isVirtualSvelteFilePath, toRealSvelteFilePath } from './utils';

/**
 * This should only be accessed by TS svelte module resolution.
 */
export function createSvelteSys(logger: Logger) {
    const svelteSys: ts.System = {
        ...ts.sys,
        fileExists(path: string) {
            return ts.sys.fileExists(ensureRealSvelteFilePath(path));
        },
        readDirectory(path, extensions, exclude, include, depth) {
            const extensionsWithSvelte = (extensions ?? []).concat('.svelte');

            return ts.sys.readDirectory(path, extensionsWithSvelte, exclude, include, depth);
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

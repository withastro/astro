import * as ts from 'typescript';
import { DocumentSnapshot } from './SnapshotManager';
import { ensureRealAstroFilePath, isAstroFilePath, isVirtualAstroFilePath, toRealAstroFilePath } from './utils';

/**
 * This should only be accessed by TS Astro module resolution.
 */
export function createAstroSys(getSnapshot: (fileName: string) => DocumentSnapshot) {
  const AstroSys: ts.System = {
    ...ts.sys,
    fileExists(path: string) {
      return ts.sys.fileExists(ensureRealAstroFilePath(path));
    },
    readFile(path: string) {
      if (isAstroFilePath(path) || isVirtualAstroFilePath(path)) {
        console.log('readFile', path);
      }
      const snapshot = getSnapshot(path);
      return snapshot.getFullText();
    },
    readDirectory(path, extensions, exclude, include, depth) {
      const extensionsWithAstro = (extensions ?? []).concat(...['.astro', '.svelte', '.vue']);
      const result = ts.sys.readDirectory(path, extensionsWithAstro, exclude, include, depth);
      return result;
    },
  };

  if (ts.sys.realpath) {
    const realpath = ts.sys.realpath;
    AstroSys.realpath = function (path) {
      if (isVirtualAstroFilePath(path)) {
        return realpath(toRealAstroFilePath(path)) + '.ts';
      }
      return realpath(path);
    };
  }

  return AstroSys;
}

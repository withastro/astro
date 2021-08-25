/* eslint-disable require-jsdoc */

import * as ts from 'typescript';
import { basename } from 'path';
import { ensureRealAstroFilePath, findTsConfigPath } from './utils';
import { Document } from '../../core/documents';
import { SnapshotManager } from './SnapshotManager';
import { createDocumentSnapshot, DocumentSnapshot } from './DocumentSnapshot';
import { createAstroModuleLoader } from './module-loader';

const services = new Map<string, Promise<LanguageServiceContainer>>();

export interface LanguageServiceContainer {
  readonly tsconfigPath: string;
  readonly snapshotManager: SnapshotManager;
  getService(): ts.LanguageService;
  updateDocument(documentOrFilePath: Document | string): ts.IScriptSnapshot;
  deleteDocument(filePath: string): void;
}

export interface LanguageServiceDocumentContext {
  getWorkspaceRoot(fileName: string): string;
  createDocument: (fileName: string, content: string) => Document;
}

export async function getLanguageService(path: string, workspaceUris: string[], docContext: LanguageServiceDocumentContext): Promise<LanguageServiceContainer> {
  const tsconfigPath = findTsConfigPath(path, workspaceUris);
  const workspaceRoot = docContext.getWorkspaceRoot(path);

  let service: LanguageServiceContainer;
  if (services.has(tsconfigPath)) {
    service = (await services.get(tsconfigPath)) as LanguageServiceContainer;
  } else {
    const newServicePromise = createLanguageService(tsconfigPath, workspaceRoot, docContext);
    services.set(tsconfigPath, newServicePromise);
    service = await newServicePromise;
  }

  return service;
}

export async function getLanguageServiceForDocument(document: Document, workspaceUris: string[], docContext: LanguageServiceDocumentContext): Promise<ts.LanguageService> {
  return getLanguageServiceForPath(document.getFilePath() || '', workspaceUris, docContext);
}

export async function getLanguageServiceForPath(path: string, workspaceUris: string[], docContext: LanguageServiceDocumentContext): Promise<ts.LanguageService> {
  return (await getLanguageService(path, workspaceUris, docContext)).getService();
}

async function createLanguageService(tsconfigPath: string, workspaceRoot: string, docContext: LanguageServiceDocumentContext): Promise<LanguageServiceContainer> {
  const parseConfigHost: ts.ParseConfigHost = {
    ...ts.sys,
    readDirectory: (path, extensions, exclude, include, depth) => {
      return ts.sys.readDirectory(path, [...extensions, '.vue', '.svelte', '.astro', '.js', '.jsx'], exclude, include, depth);
    },
  };

  let configJson = (tsconfigPath && ts.readConfigFile(tsconfigPath, ts.sys.readFile).config) || getDefaultJsConfig();
  if (!configJson.extends) {
    configJson = Object.assign(
      {
        exclude: getDefaultExclude(),
      },
      configJson
    );
  }

  const project = ts.parseJsonConfigFileContent(configJson, parseConfigHost, workspaceRoot, {}, basename(tsconfigPath), undefined, [
    { extension: '.vue', isMixedContent: true, scriptKind: ts.ScriptKind.Deferred },
    { extension: '.svelte', isMixedContent: true, scriptKind: ts.ScriptKind.Deferred },
    { extension: '.astro', isMixedContent: true, scriptKind: ts.ScriptKind.Deferred },
  ]);

  let projectVersion = 0;

  const snapshotManager = new SnapshotManager(
    project.fileNames,
    {
      exclude: ['node_modules', 'dist'],
      include: ['src'],
    },
    workspaceRoot || process.cwd()
  );

  const astroModuleLoader = createAstroModuleLoader(getScriptSnapshot, {});

  const host: ts.LanguageServiceHost = {
    getNewLine: () => ts.sys.newLine,
    useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
    readFile: astroModuleLoader.readFile,
    writeFile: astroModuleLoader.writeFile,
    fileExists: astroModuleLoader.fileExists,
    directoryExists: astroModuleLoader.directoryExists,
    getDirectories: astroModuleLoader.getDirectories,
    readDirectory: astroModuleLoader.readDirectory,
    realpath: astroModuleLoader.realpath,

    getCompilationSettings: () => project.options,
    getCurrentDirectory: () => workspaceRoot,
    getDefaultLibFileName: () => ts.getDefaultLibFilePath(project.options),

    getProjectVersion: () => `${projectVersion}`,
    getScriptFileNames: () => Array.from(new Set([...snapshotManager.getFileNames(), ...snapshotManager.getProjectFileNames()])),
    getScriptSnapshot,
    getScriptVersion: (fileName: string) => getScriptSnapshot(fileName).version.toString(),
  };

  const languageService: ts.LanguageService = ts.createLanguageService(host);
  const languageServiceProxy = new Proxy(languageService, {
    get(target, prop) {
      return Reflect.get(target, prop);
    },
  });

  return {
    tsconfigPath,
    snapshotManager,
    getService: () => languageServiceProxy,
    updateDocument,
    deleteDocument,
  };

  function onProjectUpdated() {
    projectVersion++;
  }

  function deleteDocument(filePath: string) {
    snapshotManager.delete(filePath);
  }

  function updateDocument(documentOrFilePath: Document | string) {
    const filePath = ensureRealAstroFilePath(typeof documentOrFilePath === 'string' ? documentOrFilePath : documentOrFilePath.getFilePath() || '');
    const document = typeof documentOrFilePath === 'string' ? undefined : documentOrFilePath;

    if (!filePath) {
      throw new Error(`Unable to find document`);
    }

    const previousSnapshot = snapshotManager.get(filePath);
    if (document && previousSnapshot?.version.toString() === `${document.version}`) {
      return previousSnapshot;
    }

    const currentText = document ? document.getText() : null;
    const snapshot = createDocumentSnapshot(filePath, currentText, docContext.createDocument);
    snapshotManager.set(filePath, snapshot);
    onProjectUpdated();
    return snapshot;
  }

  function getScriptSnapshot(fileName: string): DocumentSnapshot {
    fileName = ensureRealAstroFilePath(fileName);

    let doc = snapshotManager.get(fileName);
    if (doc) {
      return doc;
    }

    doc = createDocumentSnapshot(fileName, null, docContext.createDocument);
    snapshotManager.set(fileName, doc);
    return doc;
  }
}

/**
 * This should only be used when there's no jsconfig/tsconfig at all
 */
function getDefaultJsConfig(): {
  compilerOptions: ts.CompilerOptions;
  include: string[];
} {
  return {
    compilerOptions: {
      maxNodeModuleJsDepth: 2,
      allowSyntheticDefaultImports: true,
      allowJs: true,
    },
    include: ['src'],
  };
}

function getDefaultExclude() {
  return ['dist', 'node_modules'];
}

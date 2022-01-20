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
  createDocument: (fileName: string, content: string, overrideText: boolean) => Document;
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

  let configJson = (tsconfigPath && ts.readConfigFile(tsconfigPath, ts.sys.readFile).config) || {};

  // If our user has types in their config but it doesn't include the types for ImportMeta, let's add them for them
  if (
    configJson.compilerOptions?.types &&
    !configJson.compilerOptions?.types.includes("vite/client")
  ) {
    configJson.compilerOptions.types.push("vite/client");
  }

  configJson.compilerOptions = Object.assign(
    getDefaultCompilerOptions(),
    configJson.compilerOptions
  );
  // If the user supplied exclude, let's use theirs
  configJson.exclude ?? (configJson.exclude = getDefaultExclude());

  // Delete include so that .astro files don't get mistakenly excluded by the user
  delete configJson.include;

  // Everything here will always, unconditionally, be in the resulting config, not the opposite, tricky
  const existingCompilerOptions: ts.CompilerOptions = {
    // Setting strict to true for .astro files leads to a lot of unrelated errors (see language-tools#91) so we force it off for .astro files
    strict: false,
    jsx: ts.JsxEmit.Preserve,
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ESNext,
  };

  const project = ts.parseJsonConfigFileContent(configJson, parseConfigHost, workspaceRoot, existingCompilerOptions, basename(tsconfigPath), undefined, [
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

    getProjectVersion: () => projectVersion.toString(),
    getScriptFileNames: () => Array.from(new Set([...snapshotManager.getFileNames(), ...snapshotManager.getProjectFileNames()])),
    getScriptSnapshot,
    getScriptVersion: (fileName: string) => {
      let snapshotVersion = getScriptSnapshot(fileName).version.toString();
      return snapshotVersion;
    },
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

function getDefaultCompilerOptions(): ts.CompilerOptions {
   return {
     maxNodeModuleJsDepth: 2,
     allowSyntheticDefaultImports: true,
     allowJs: true,
     // By providing vite/client here, our users get proper typing on import.meta in .astro files
     types: ["vite/client"],
   };
}

function getDefaultExclude() {
  return ['dist', 'node_modules'];
}

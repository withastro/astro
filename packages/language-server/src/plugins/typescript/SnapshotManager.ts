import * as ts from 'typescript';
import { TextDocumentContentChangeEvent } from 'vscode-languageserver';
import { toVirtualAstroFilePath } from './utils';
import { DocumentSnapshot, TypeScriptDocumentSnapshot, createDocumentSnapshot } from './DocumentSnapshot';

export interface TsFilesSpec {
  include?: readonly string[];
  exclude?: readonly string[];
}

export class SnapshotManager {
  private documents: Map<string, DocumentSnapshot> = new Map();
  private lastLogged = new Date(new Date().getTime() - 60_001);

  private readonly watchExtensions = [ts.Extension.Dts, ts.Extension.Js, ts.Extension.Jsx, ts.Extension.Ts, ts.Extension.Tsx, ts.Extension.Json];

  constructor(private projectFiles: string[], private fileSpec: TsFilesSpec, private workspaceRoot: string) {}

  updateProjectFiles() {
    const { include, exclude } = this.fileSpec;

    if (include?.length === 0) return;

    const projectFiles = ts.sys.readDirectory(this.workspaceRoot, this.watchExtensions, exclude, include);

    this.projectFiles = Array.from(new Set([...this.projectFiles, ...projectFiles]));
  }

  updateProjectFile(fileName: string, changes?: TextDocumentContentChangeEvent[]): void {
    const previousSnapshot = this.get(fileName);

    if (changes) {
      if (!(previousSnapshot instanceof TypeScriptDocumentSnapshot)) {
        return;
      }
      previousSnapshot.update(changes);
    } else {
      const newSnapshot = createDocumentSnapshot(fileName, null);

      if (previousSnapshot) {
        newSnapshot.version = previousSnapshot.version + 1;
      } else {
        // ensure it's greater than initial version
        // so that ts server picks up the change
        newSnapshot.version += 1;
      }
      this.set(fileName, newSnapshot);
    }
  }

  has(fileName: string) {
    return this.projectFiles.includes(fileName) || this.getFileNames().includes(fileName);
  }

  get(fileName: string) {
    return this.documents.get(fileName);
  }

  set(fileName: string, snapshot: DocumentSnapshot) {
    // const prev = this.get(fileName);
    this.logStatistics();
    return this.documents.set(fileName, snapshot);
  }

  delete(fileName: string) {
    this.projectFiles = this.projectFiles.filter((s) => s !== fileName);
    return this.documents.delete(fileName);
  }

  getFileNames() {
    return Array.from(this.documents.keys()).map((fileName) => toVirtualAstroFilePath(fileName));
  }

  getProjectFileNames() {
    return [...this.projectFiles];
  }

  private logStatistics() {
    const date = new Date();
    // Don't use setInterval because that will keep tests running forever
    if (date.getTime() - this.lastLogged.getTime() > 60_000) {
      this.lastLogged = date;

      const projectFiles = this.getProjectFileNames();
      const allFiles = Array.from(new Set([...projectFiles, ...this.getFileNames()]));
      console.log(
        'SnapshotManager File Statistics:\n' +
          `Project files: ${projectFiles.length}\n` +
          `Astro files: ${allFiles.filter((name) => name.endsWith('.astro')).length}\n` +
          `From node_modules: ${allFiles.filter((name) => name.includes('node_modules')).length}\n` +
          `Total: ${allFiles.length}`
      );
    }
  }
}

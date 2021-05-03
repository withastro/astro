import * as ts from 'typescript';
import { TextDocumentContentChangeEvent, Position } from 'vscode-languageserver';
import { Document } from '../../core/documents';
import { positionAt, offsetAt } from '../../core/documents/utils';
import { pathToUrl } from '../../utils';
import { getScriptKindFromFileName, isAstroFilePath, toVirtualAstroFilePath } from './utils';

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
      const newSnapshot = createDocumentSnapshot(fileName);

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

export interface DocumentSnapshot extends ts.IScriptSnapshot {
  version: number;
  filePath: string;
  scriptKind: ts.ScriptKind;
  positionAt(offset: number): Position;
  /**
   * Instantiates a source mapper.
   * `destroyFragment` needs to be called when
   * it's no longer needed / the class should be cleaned up
   * in order to prevent memory leaks.
   */
  getFragment(): Promise<DocumentFragmentSnapshot>;
  /**
   * Needs to be called when source mapper
   * is no longer needed / the class should be cleaned up
   * in order to prevent memory leaks.
   */
  destroyFragment(): void;
  /**
   * Convenience function for getText(0, getLength())
   */
  getFullText(): string;
}

export const createDocumentSnapshot = (filePath: string, createDocument?: (_filePath: string, text: string) => Document): DocumentSnapshot => {
  const text = ts.sys.readFile(filePath) ?? '';

  if (isAstroFilePath(filePath)) {
    if (!createDocument) throw new Error('Astro documents require the "createDocument" utility to be provided');
    const snapshot = new AstroDocumentSnapshot(createDocument(filePath, text));
    return snapshot;
  }

  return new TypeScriptDocumentSnapshot(0, filePath, text);
};

class AstroDocumentSnapshot implements DocumentSnapshot {
  version = this.doc.version;
  scriptKind = ts.ScriptKind.Unknown;

  constructor(private doc: Document) {}

  async getFragment(): Promise<DocumentFragmentSnapshot> {
    return new DocumentFragmentSnapshot(this.doc);
  }

  async destroyFragment() {
    return;
  }

  get text() {
    return this.doc.getText();
  }

  get filePath() {
    return this.doc.getFilePath() || '';
  }

  getText(start: number, end: number) {
    return this.text.substring(start, end);
  }

  getLength() {
    return this.text.length;
  }

  getFullText() {
    return this.text;
  }

  getChangeRange() {
    return undefined;
  }

  positionAt(offset: number) {
    return positionAt(offset, this.text);
  }

  getLineContainingOffset(offset: number) {
    const chunks = this.getText(0, offset).split('\n');
    return chunks[chunks.length - 1];
  }

  offsetAt(position: Position) {
    return offsetAt(position, this.text);
  }
}

class DocumentFragmentSnapshot implements Omit<DocumentSnapshot, 'getFragment' | 'destroyFragment'> {
  version: number;
  filePath: string;
  url: string;
  text: string;

  scriptKind = ts.ScriptKind.TSX;
  scriptInfo = null;

  constructor(private doc: Document) {
    const filePath = doc.getFilePath();
    if (!filePath) throw new Error('Cannot create a document fragment from a non-local document');
    const text = doc.getText();
    this.version = doc.version;
    this.filePath = toVirtualAstroFilePath(filePath);
    this.url = toVirtualAstroFilePath(filePath);
    this.text = this.transformContent(text);
  }

  /** @internal */
  private transformContent(content: string) {
    return content.replace(/---/g, '///');
  }

  getText(start: number, end: number) {
    return this.text.substring(start, end);
  }

  getLength() {
    return this.text.length;
  }

  getFullText() {
    return this.text;
  }

  getChangeRange() {
    return undefined;
  }

  positionAt(offset: number) {
    return positionAt(offset, this.text);
  }

  getLineContainingOffset(offset: number) {
    const chunks = this.getText(0, offset).split('\n');
    return chunks[chunks.length - 1];
  }

  offsetAt(position: Position): number {
    return offsetAt(position, this.text);
  }
}

class TypeScriptDocumentSnapshot implements DocumentSnapshot {
  scriptKind = getScriptKindFromFileName(this.filePath);
  scriptInfo = null;
  url: string;

  constructor(public version: number, public readonly filePath: string, private text: string) {
    this.url = pathToUrl(filePath);
  }

  getText(start: number, end: number) {
    return this.text.substring(start, end);
  }

  getLength() {
    return this.text.length;
  }

  getFullText() {
    return this.text;
  }

  getChangeRange() {
    return undefined;
  }

  positionAt(offset: number) {
    return positionAt(offset, this.text);
  }

  offsetAt(position: Position): number {
    return offsetAt(position, this.text);
  }

  async getFragment(): Promise<DocumentFragmentSnapshot> {
    return (this as unknown) as any;
  }

  destroyFragment() {
    // nothing to clean up
  }

  getLineContainingOffset(offset: number) {
    const chunks = this.getText(0, offset).split('\n');
    return chunks[chunks.length - 1];
  }

  update(changes: TextDocumentContentChangeEvent[]): void {
    for (const change of changes) {
      let start = 0;
      let end = 0;
      if ('range' in change) {
        start = this.offsetAt(change.range.start);
        end = this.offsetAt(change.range.end);
      } else {
        end = this.getLength();
      }

      this.text = this.text.slice(0, start) + change.text + this.text.slice(end);
    }

    this.version++;
  }
}

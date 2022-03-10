import * as ts from 'typescript';
import { TextDocumentContentChangeEvent, Position, Range } from 'vscode-languageserver';
import { Document, DocumentMapper, IdentityMapper } from '../../core/documents';
import { isInTag, positionAt, offsetAt } from '../../core/documents/utils';
import { pathToUrl } from '../../utils';
import { getScriptKindFromFileName, isAstroFilePath, toVirtualAstroFilePath, isVirtualSvelteFilePath, isFrameworkFilePath, isVirtualFrameworkFilePath } from './utils';
import { EOL } from 'os';
import astro2tsx from './astro2tsx';
import { toTSX as Svelte2TSX } from "@astrojs/svelte-language-integration"

/**
 * The mapper to get from original snapshot positions to generated and vice versa.
 */
export interface SnapshotFragment extends DocumentMapper {
  positionAt(offset: number): Position;
  offsetAt(position: Position): number;
}

/**
 * An error which occured while trying to parse/preprocess the Astro file contents.
 */
 export interface ParserError {
  message: string;
  range: Range;
  code: number;
}

export interface DocumentSnapshot extends ts.IScriptSnapshot {
	version: number;
	filePath: string;
	scriptKind: ts.ScriptKind;
	parserError: ParserError | null;

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

	createFragment(mapper: IdentityMapper): DocumentFragmentSnapshot;

	toTSX(code: string, filePath: string): string
}

export abstract class DocumentFragmentSnapshot implements Omit<DocumentSnapshot, 'createFragment' | 'getFragment' | 'destroyFragment' | 'toTSX'>, SnapshotFragment {
	version: number;
	filePath: string;
	url: string;
	text: string;
	parserError = null;

	scriptKind = ts.ScriptKind.TSX;
	scriptInfo = null;

	constructor(private mapper: any, private parent: Document, toTSX: (code: string, filePath: string) => string) {
		const filePath = parent.getFilePath();
		if (!filePath) throw new Error('Cannot create a document fragment from a non-local document');
		const text = parent.getText();
		this.version = parent.version;
		this.filePath = this.toVirtualFilePath(filePath);
		this.url = this.toVirtualFilePath(filePath);
		this.text = toTSX(text, this.filePath);
	}

	abstract toVirtualFilePath(filePath: string): string;

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
		const chunks = this.getText(0, offset).split(EOL);
		return chunks[chunks.length - 1];
	}

	offsetAt(position: Position): number {
		return offsetAt(position, this.text);
	}

	getOriginalPosition(pos: Position): Position {
		return this.mapper.getOriginalPosition(pos);
	}

	getGeneratedPosition(pos: Position): Position {
		return this.mapper.getGeneratedPosition(pos);
	}

	isInGenerated(pos: Position): boolean {
		return !isInTag(pos, this.parent.styleInfo);
	}

	getURL(): string {
		return this.url;
	}
}

abstract class DocumentSnapshotBase implements DocumentSnapshot {
	version = this.doc.version;
	scriptKind = ts.ScriptKind.TSX;
	parserError = null;

	constructor(public doc: Document) {}

	abstract getFragment(): Promise<DocumentFragmentSnapshot>;
	abstract destroyFragment(): void
	abstract createFragment(mapper: IdentityMapper): DocumentFragmentSnapshot
	abstract toTSX(code: string, filePath: string): string

	get text() {
		let raw = this.doc.getText();
		return this.toTSX(raw, this.filePath);
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
		const chunks = this.getText(0, offset).split(EOL);
		return chunks[chunks.length - 1];
	}

	offsetAt(position: Position) {
		return offsetAt(position, this.text);
	}

	public getMapper(uri: string) {
		return new IdentityMapper(uri);
	}
}

class FrameworkDocumentSnapshot extends DocumentSnapshotBase {
	toTSX(code: string, filePath: string): string {
		if (isVirtualSvelteFilePath(filePath)) {
			return Svelte2TSX(code);
		}
		return 'export default function() {}';
	}

	createFragment(mapper: IdentityMapper): FrameworkDocumentFragmentSnapshot {
			return new FrameworkDocumentFragmentSnapshot(mapper, this.doc, this.toTSX)
	}

	async getFragment(): Promise<FrameworkDocumentFragmentSnapshot> {
		const uri = pathToUrl(this.filePath);
		const mapper = await this.getMapper(uri);
		return this.createFragment(mapper)
	}

	async destroyFragment() {
		return;
	}
}

class FrameworkDocumentFragmentSnapshot extends DocumentFragmentSnapshot {
	toVirtualFilePath(filePath: string): string {
		return filePath;
	}
}


class AstroDocumentSnapshot extends DocumentSnapshotBase {
	createFragment(mapper: IdentityMapper): AstroDocumentFragmentSnapshot {
		return new AstroDocumentFragmentSnapshot(mapper, this.doc, this.toTSX);
	}

	async getFragment(): Promise<FrameworkDocumentFragmentSnapshot> {
		const uri = pathToUrl(this.filePath);
		const mapper = await this.getMapper(uri);
		return new AstroDocumentFragmentSnapshot(mapper, this.doc, this.toTSX);
	}

	async destroyFragment() {
		return;
	}

	toTSX(code: string, filePath: string): string {
		return astro2tsx(code).code;
	}
}

export class AstroDocumentFragmentSnapshot extends DocumentFragmentSnapshot {
	toVirtualFilePath(filePath: string): string {
		return toVirtualAstroFilePath(filePath)
	}
}

export class TypeScriptDocumentSnapshot implements DocumentSnapshot {
	scriptKind = getScriptKindFromFileName(this.filePath);
	scriptInfo = null;
	parserError = null;
	url: string;

	constructor(public version: number, public readonly filePath: string, private text: string) {
		this.url = pathToUrl(filePath);
	}

	// We don't create Fragments for TypescriptDocument, nor do we convert them to TSX so those three methods are not
	// necessary, though they're required to be implemented for DocumentSnapshot
	toTSX(): any {
		return;
	}

	createFragment(): any {
		return;
	}

	destroyFragment() {
		return;
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

	async getFragment(): Promise<FrameworkDocumentFragmentSnapshot> {
		return this as unknown as any;
	}

	getOriginalPosition(pos: Position): Position {
		return pos;
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

export const createDocumentSnapshot = (
	filePath: string,
	currentText: string | null,
	createDocument?: (_filePath: string, text: string, overrideText: boolean) => Document
): DocumentSnapshot => {
	let text = currentText || (ts.sys.readFile(filePath.replace(".tsx", "")) ?? '');

	if (isVirtualFrameworkFilePath('vue', 'tsx', filePath) || isVirtualFrameworkFilePath('svelte', 'tsx', filePath)) {
		if (!createDocument) throw new Error('Framework documents require the "createDocument" utility to be provided');
		const snapshot = new FrameworkDocumentSnapshot(createDocument(filePath, text, currentText !== null));
		return snapshot;
	}

	if (isAstroFilePath(filePath)) {
		if (!createDocument) throw new Error('Astro documents require the "createDocument" utility to be provided');
		const snapshot = new AstroDocumentSnapshot(createDocument(filePath, text, currentText !== null));
		return snapshot;
	}

	return new TypeScriptDocumentSnapshot(0, filePath, text);
};

import ts from 'typescript';
import { Position, TextDocumentContentChangeEvent } from 'vscode-languageserver';
import {
	AstroDocument,
	DocumentMapper,
	positionAt,
	getLineOffsets,
	offsetAt,
	IdentityMapper,
	FragmentMapper,
	TagInformation,
} from '../../../core/documents';
import { pathToUrl } from '../../../utils';
import { FrameworkExt, getScriptKindFromFileName } from '../utils';

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
	createFragment(): Promise<SnapshotFragment>;
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

/**
 * The mapper to get from original snapshot positions to generated and vice versa.
 */
export interface SnapshotFragment extends DocumentMapper {
	positionAt(offset: number): Position;
	offsetAt(position: Position): number;
}

/**
 * Snapshots used for Astro files
 */
export class AstroSnapshot implements DocumentSnapshot {
	private fragment?: AstroSnapshotFragment;
	version = this.parent.version;
	public scriptTagSnapshots: ScriptTagDocumentSnapshot[] = [];

	constructor(
		public readonly parent: AstroDocument,
		private readonly text: string,
		public readonly scriptKind: ts.ScriptKind
	) {}

	async createFragment() {
		if (!this.fragment) {
			const uri = pathToUrl(this.filePath);
			this.fragment = new AstroSnapshotFragment(new IdentityMapper(uri), this.parent, this.text, uri);
		}
		return this.fragment;
	}

	destroyFragment() {
		return null;
	}

	get filePath() {
		return this.parent.getFilePath() || '';
	}

	getText(start: number, end: number): string {
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
}

export class AstroSnapshotFragment implements SnapshotFragment {
	private lineOffsets = getLineOffsets(this.text);

	constructor(
		private readonly mapper: DocumentMapper,
		public readonly parent: AstroDocument,
		public readonly text: string,
		private readonly url: string
	) {}

	positionAt(offset: number) {
		return positionAt(offset, this.text, this.lineOffsets);
	}

	offsetAt(position: Position) {
		return offsetAt(position, this.text, this.lineOffsets);
	}

	getOriginalPosition(pos: Position): Position {
		return this.mapper.getOriginalPosition(pos);
	}

	getGeneratedPosition(pos: Position): Position {
		return this.mapper.getGeneratedPosition(pos);
	}

	isInGenerated(pos: Position): boolean {
		throw new Error('Method not implemented.');
	}

	getURL(): string {
		return this.url;
	}
}

export class ScriptTagDocumentSnapshot extends FragmentMapper implements DocumentSnapshot, SnapshotFragment {
	readonly version = this.parent.version;
	private text = this.parent.getText().slice(this.scriptTag.start, this.scriptTag.end) + '\nexport {}';

	scriptKind: ts.ScriptKind;
	private lineOffsets?: number[];

	constructor(public scriptTag: TagInformation, private readonly parent: AstroDocument, public filePath: string) {
		super(parent.getText(), scriptTag, filePath);

		this.scriptKind = ts.ScriptKind.JS;
	}

	positionAt(offset: number) {
		return positionAt(offset, this.text, this.getLineOffsets());
	}

	offsetAt(position: Position): number {
		return offsetAt(position, this.text, this.getLineOffsets());
	}

	async createFragment(): Promise<SnapshotFragment> {
		return this;
	}

	destroyFragment(): void {
		//
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

	private getLineOffsets() {
		if (!this.lineOffsets) {
			this.lineOffsets = getLineOffsets(this.text);
		}
		return this.lineOffsets;
	}
}

/**
 * Snapshot used for anything that is not an Astro file
 * It's both used for .js(x)/.ts(x) files and .svelte/.vue files
 */
export class TypeScriptDocumentSnapshot extends IdentityMapper implements DocumentSnapshot, SnapshotFragment {
	scriptKind: ts.ScriptKind;
	private lineOffsets?: number[];

	constructor(
		public version: number,
		public readonly filePath: string,
		private text: string,
		scriptKind?: ts.ScriptKind,
		public readonly framework?: FrameworkExt
	) {
		super(pathToUrl(filePath));

		scriptKind ? (this.scriptKind = scriptKind) : (this.scriptKind = getScriptKindFromFileName(filePath));
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
		return positionAt(offset, this.text, this.getLineOffsets());
	}

	offsetAt(position: Position): number {
		return offsetAt(position, this.text, this.getLineOffsets());
	}

	async createFragment() {
		return this;
	}

	destroyFragment() {
		// nothing to clean up
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
		this.lineOffsets = undefined;
	}

	private getLineOffsets() {
		if (!this.lineOffsets) {
			this.lineOffsets = getLineOffsets(this.text);
		}
		return this.lineOffsets;
	}
}

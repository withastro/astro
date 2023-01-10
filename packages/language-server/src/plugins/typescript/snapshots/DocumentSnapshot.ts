import { DiagnosticMessage } from '@astrojs/compiler/types';
import { EncodedSourceMap, TraceMap } from '@jridgewell/trace-mapping';
import { DiagnosticSeverity, Position, TextDocumentContentChangeEvent } from 'vscode-languageserver';
import {
	AstroDocument,
	DocumentMapper,
	FragmentMapper,
	getLineOffsets,
	IdentityMapper,
	offsetAt,
	positionAt,
	SourceMapDocumentMapper,
	TagInformation,
} from '../../../core/documents';
import { pathToUrl } from '../../../utils';

export interface DocumentSnapshot extends ts.IScriptSnapshot, DocumentMapper {
	version: number;
	filePath: string;
	scriptKind: ts.ScriptKind;
	positionAt(offset: number): Position;
	offsetAt(position: Position): number;
	/**
	 * Convenience function for getText(0, getLength())
	 */
	getFullText(): string;
}

/**
 * Snapshots used for Astro files
 */
export class AstroSnapshot implements DocumentSnapshot {
	private mapper?: DocumentMapper;
	private lineOffsets?: number[];
	private url = pathToUrl(this.filePath);
	public scriptTagSnapshots: ScriptTagDocumentSnapshot[] = [];

	version = this.parent.version;

	constructor(
		public readonly parent: AstroDocument,
		private readonly text: string,
		private readonly tsxMap: EncodedSourceMap,
		public readonly scriptKind: ts.ScriptKind,
		public readonly compilerDiagnostics: DiagnosticMessage[]
	) {}

	get isInErrorState(): boolean {
		return this.compilerDiagnostics.filter((diag) => diag.severity === DiagnosticSeverity.Error).length > 0;
	}

	isInGenerated(pos: Position): boolean {
		throw new Error('Method not implemented.');
	}

	getURL(): string {
		return this.url;
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

	positionAt(offset: number): Position {
		return positionAt(offset, this.text, this.getLineOffsets());
	}

	offsetAt(position: Position): number {
		return offsetAt(position, this.text, this.getLineOffsets());
	}

	getOriginalPosition(pos: Position): Position {
		return this.getMapper().getOriginalPosition(pos);
	}

	getGeneratedPosition(pos: Position): Position {
		return this.getMapper().getGeneratedPosition(pos);
	}

	private getLineOffsets() {
		if (!this.lineOffsets) {
			this.lineOffsets = getLineOffsets(this.text);
		}
		return this.lineOffsets;
	}

	private getMapper() {
		if (!this.mapper) {
			this.mapper = new ConsumerDocumentMapper(new TraceMap(this.tsxMap), this.url, 0);
		}
		return this.mapper;
	}
}

/**
 * Snapshots used for script tags inside Astro files
 */
export class ScriptTagDocumentSnapshot extends FragmentMapper implements DocumentSnapshot {
	readonly version = this.parent.version;
	private text = this.parent.getText().slice(this.scriptTag.start, this.scriptTag.end) + '\nexport {}';
	private lineOffsets?: number[];

	constructor(
		public scriptTag: TagInformation,
		private readonly parent: AstroDocument,
		public filePath: string,
		public readonly scriptKind: ts.ScriptKind
	) {
		super(parent.getText(), scriptTag, filePath);
	}

	positionAt(offset: number) {
		return positionAt(offset, this.text, this.getLineOffsets());
	}

	offsetAt(position: Position): number {
		return offsetAt(position, this.text, this.getLineOffsets());
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
export class TypeScriptDocumentSnapshot extends IdentityMapper implements DocumentSnapshot {
	scriptKind: ts.ScriptKind;
	private lineOffsets?: number[];

	constructor(
		public version: number,
		public readonly filePath: string,
		private text: string,
		scriptKind: ts.ScriptKind,
		public readonly supportPartialUpdate: boolean
	) {
		super(pathToUrl(filePath));

		this.scriptKind = scriptKind;
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

	createFragment() {
		return this;
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

export class ConsumerDocumentMapper extends SourceMapDocumentMapper {
	constructor(traceMap: TraceMap, sourceUri: string, private nrPrependesLines: number) {
		super(traceMap, sourceUri);
	}

	getOriginalPosition(generatedPosition: Position): Position {
		return super.getOriginalPosition(
			Position.create(generatedPosition.line - this.nrPrependesLines, generatedPosition.character)
		);
	}

	getGeneratedPosition(originalPosition: Position): Position {
		const result = super.getGeneratedPosition(originalPosition);
		result.line += this.nrPrependesLines;
		return result;
	}

	isInGenerated(): boolean {
		// always return true and map outliers case by case
		return true;
	}
}

import { EncodedSourceMap, originalPositionFor, TraceMap } from '@jridgewell/trace-mapping';
import type ts from 'typescript/lib/tsserverlibrary';
import { astro2tsx } from './astro2tsx.js';
import type { Logger } from './logger.js';
import { isAstroFilePath } from './utils.js';

export class AstroSnapshot {
	private scriptInfo?: ts.server.ScriptInfo;
	private lineOffsets?: number[];
	private convertInternalCodePositions = false;

	constructor(
		private typescript: typeof ts,
		private fileName: string,
		private astroCode: string,
		private traceMap: TraceMap,
		private logger: Logger
	) {}

	update(astroCode: string, traceMap: TraceMap) {
		this.astroCode = astroCode;
		this.traceMap = traceMap;
		this.lineOffsets = undefined;
		this.log('Updated Snapshot');
	}

	getOriginalTextSpan(textSpan: ts.TextSpan): ts.TextSpan | null {
		const start = this.getOriginalOffset(textSpan.start);
		if (start === -1) {
			return null;
		}

		// Assumption: We don't change identifiers itself, so we don't change ranges.
		return {
			start,
			length: textSpan.length,
		};
	}

	getOriginalOffset(generatedOffset: number) {
		if (!this.scriptInfo) {
			return generatedOffset;
		}

		this.toggleMappingMode(true);
		const lineOffset = this.scriptInfo.positionToLineOffset(generatedOffset);
		this.debug('try convert offset', generatedOffset, '/', lineOffset);
		const original = originalPositionFor(this.traceMap, {
			line: lineOffset.line,
			column: lineOffset.offset,
		});
		this.toggleMappingMode(false);

		if (!original.line) {
			return -1;
		}

		const originalOffset = this.scriptInfo.lineOffsetToPosition(original.line, original.column);
		this.debug('converted offset to', original, '/', originalOffset);
		return originalOffset;
	}

	setAndPatchScriptInfo(scriptInfo: ts.server.ScriptInfo) {
		// @ts-expect-error
		scriptInfo.scriptKind = this.typescript.ScriptKind.TSX;

		const positionToLineOffset = scriptInfo.positionToLineOffset.bind(scriptInfo);
		scriptInfo.positionToLineOffset = (position) => {
			if (this.convertInternalCodePositions) {
				const lineOffset = positionToLineOffset(position);
				this.debug('positionToLineOffset for generated code', position, lineOffset);
				return lineOffset;
			}

			const lineOffset = this.positionAt(position);
			this.debug('positionToLineOffset for original code', position, lineOffset);
			return { line: lineOffset.line + 1, offset: lineOffset.character + 1 };
		};

		const lineOffsetToPosition = scriptInfo.lineOffsetToPosition.bind(scriptInfo);
		scriptInfo.lineOffsetToPosition = (line, offset) => {
			if (this.convertInternalCodePositions) {
				const position = lineOffsetToPosition(line, offset);
				this.debug('lineOffsetToPosition for generated code', { line, offset }, position);
				return position;
			}

			const position = this.offsetAt({ line: line - 1, character: offset - 1 });
			this.debug('lineOffsetToPosition for original code', { line, offset }, position);
			return position;
		};

		this.scriptInfo = scriptInfo;
		this.log('patched scriptInfo');
	}

	/**
	 * Get the line and character based on the offset
	 * @param offset The index of the position
	 */
	positionAt(offset: number): ts.LineAndCharacter {
		offset = this.clamp(offset, 0, this.astroCode.length);

		const lineOffsets = this.getLineOffsets();
		let low = 0;
		let high = lineOffsets.length;
		if (high === 0) {
			return { line: 0, character: offset };
		}

		while (low < high) {
			const mid = Math.floor((low + high) / 2);
			if (lineOffsets[mid] > offset) {
				high = mid;
			} else {
				low = mid + 1;
			}
		}

		// low is the least x for which the line offset is larger than the current offset
		// or array.length if no line offset is larger than the current offset
		const line = low - 1;

		return { line, character: offset - lineOffsets[line] };
	}

	/**
	 * Get the index of the line and character position
	 * @param position Line and character position
	 */
	offsetAt(position: ts.LineAndCharacter): number {
		const lineOffsets = this.getLineOffsets();

		if (position.line >= lineOffsets.length) {
			return this.astroCode.length;
		} else if (position.line < 0) {
			return 0;
		}

		const lineOffset = lineOffsets[position.line];
		const nextLineOffset =
			position.line + 1 < lineOffsets.length ? lineOffsets[position.line + 1] : this.astroCode.length;

		return this.clamp(nextLineOffset, lineOffset, lineOffset + position.character);
	}

	private getLineOffsets() {
		if (this.lineOffsets) {
			return this.lineOffsets;
		}

		const lineOffsets = [];
		const text = this.astroCode;
		let isLineStart = true;

		for (let i = 0; i < text.length; i++) {
			if (isLineStart) {
				lineOffsets.push(i);
				isLineStart = false;
			}
			const ch = text.charAt(i);
			isLineStart = ch === '\r' || ch === '\n';
			if (ch === '\r' && i + 1 < text.length && text.charAt(i + 1) === '\n') {
				i++;
			}
		}

		if (isLineStart && text.length > 0) {
			lineOffsets.push(text.length);
		}

		this.lineOffsets = lineOffsets;
		return lineOffsets;
	}

	private clamp(num: number, min: number, max: number): number {
		return Math.max(min, Math.min(max, num));
	}

	private log(...args: any[]) {
		this.logger.log('AstroSnapshot:', this.fileName, '-', ...args);
	}

	private debug(...args: any[]) {
		this.logger.debug('AstroSnapshot:', this.fileName, '-', ...args);
	}

	private toggleMappingMode(convertInternalCodePositions: boolean) {
		this.convertInternalCodePositions = convertInternalCodePositions;
	}

	private getText() {
		const snapshot = this.scriptInfo?.getSnapshot();
		if (!snapshot) {
			return '';
		}
		return snapshot.getText(0, snapshot.getLength());
	}
}

export class AstroSnapshotManager {
	private snapshots = new Map<string, AstroSnapshot>();

	constructor(private typescript: typeof ts, private projectService: ts.server.ProjectService, private logger: Logger) {
		this.patchProjectServiceReadFile();
	}

	get(fileName: string) {
		return this.snapshots.get(fileName);
	}

	create(fileName: string): AstroSnapshot | undefined {
		if (this.snapshots.has(fileName)) {
			return this.snapshots.get(fileName)!;
		}

		// This will trigger projectService.host.readFile which is patched below
		const scriptInfo = this.projectService.getOrCreateScriptInfoForNormalizedPath(
			this.typescript.server.toNormalizedPath(fileName),
			false
		);
		if (!scriptInfo) {
			this.logger.log('Was not able get snapshot for', fileName);
			return;
		}

		try {
			scriptInfo.getSnapshot(); // needed to trigger readFile
		} catch (e) {
			this.logger.log('Loading Snapshot failed', fileName);
		}
		const snapshot = this.snapshots.get(fileName);
		if (!snapshot) {
			this.logger.log('Astro snapshot was not found after trying to load script snapshot for', fileName);
			return; // should never get here
		}
		snapshot.setAndPatchScriptInfo(scriptInfo);
		this.snapshots.set(fileName, snapshot);
		return snapshot;
	}

	private patchProjectServiceReadFile() {
		const readFile = this.projectService.host.readFile;
		this.projectService.host.readFile = (path: string) => {
			if (isAstroFilePath(path)) {
				this.logger.debug('Read Astro file:', path);
				const astroCode = readFile(path) || '';
				try {
					const result = astro2tsx(astroCode, path);
					const existingSnapshot = this.snapshots.get(path);
					if (existingSnapshot) {
						existingSnapshot.update(astroCode, new TraceMap(result.map as EncodedSourceMap));
					} else {
						this.snapshots.set(
							path,
							new AstroSnapshot(
								this.typescript,
								path,
								astroCode,
								new TraceMap(result.map as EncodedSourceMap),
								this.logger
							)
						);
					}
					this.logger.log('Successfully read Astro file contents of', path);
					return result.code;
				} catch (e) {
					this.logger.log('Error loading Astro file:', path);
					this.logger.debug('Error:', e);
				}
			} else {
				return readFile(path);
			}
		};
	}
}

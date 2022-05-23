import { svelte2tsx } from 'svelte2tsx';
import type ts from 'typescript/lib/tsserverlibrary';
import { ConfigManager } from './config-manager';
import { Logger } from './logger';
import { SourceMapper } from './source-mapper';
import { isNoTextSpanInGeneratedCode, isSvelteFilePath } from './utils';

export class SvelteSnapshot {
    private scriptInfo?: ts.server.ScriptInfo;
    private lineOffsets?: number[];
    private convertInternalCodePositions = false;

    constructor(
        private typescript: typeof ts,
        private fileName: string,
        private svelteCode: string,
        private mapper: SourceMapper,
        private logger: Logger,
        public readonly isTsFile: boolean
    ) {}

    update(svelteCode: string, mapper: SourceMapper) {
        this.svelteCode = svelteCode;
        this.mapper = mapper;
        this.lineOffsets = undefined;
        this.log('Updated Snapshot');
    }

    getOriginalTextSpan(textSpan: ts.TextSpan): ts.TextSpan | null {
        if (!isNoTextSpanInGeneratedCode(this.getText(), textSpan)) {
            return null;
        }

        const start = this.getOriginalOffset(textSpan.start);
        if (start === -1) {
            return null;
        }

        // Assumption: We don't change identifiers itself, so we don't change ranges.
        return {
            start,
            length: textSpan.length
        };
    }

    getOriginalOffset(generatedOffset: number) {
        if (!this.scriptInfo) {
            return generatedOffset;
        }

        this.toggleMappingMode(true);
        const lineOffset = this.scriptInfo.positionToLineOffset(generatedOffset);
        this.debug('try convert offset', generatedOffset, '/', lineOffset);
        const original = this.mapper.getOriginalPosition({
            line: lineOffset.line - 1,
            character: lineOffset.offset - 1
        });
        this.toggleMappingMode(false);
        if (original.line === -1) {
            return -1;
        }

        const originalOffset = this.scriptInfo.lineOffsetToPosition(
            original.line + 1,
            original.character + 1
        );
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

        // TODO do we need to patch this?
        // const lineToTextSpan = scriptInfo.lineToTextSpan.bind(scriptInfo);
        // scriptInfo.lineToTextSpan = (line) => {
        //     if (this.convertInternalCodePositions) {
        //         const span = lineToTextSpan(line);
        //         this.debug('lineToTextSpan for generated code', line, span);
        //         return span;
        //     }

        //     const lineOffset = this.getLineOffsets();
        //     const start = lineOffset[line - 1];
        //     const span: ts.TextSpan = {
        //         start,
        //         length: (lineOffset[line] || this.svelteCode.length) - start
        //     };
        //     this.debug('lineToTextSpan for original code', line, span);
        //     return span;
        // };

        this.scriptInfo = scriptInfo;
        this.log('patched scriptInfo');
    }

    /**
     * Get the line and character based on the offset
     * @param offset The index of the position
     */
    positionAt(offset: number): ts.LineAndCharacter {
        offset = this.clamp(offset, 0, this.svelteCode.length);

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
            return this.svelteCode.length;
        } else if (position.line < 0) {
            return 0;
        }

        const lineOffset = lineOffsets[position.line];
        const nextLineOffset =
            position.line + 1 < lineOffsets.length
                ? lineOffsets[position.line + 1]
                : this.svelteCode.length;

        return this.clamp(nextLineOffset, lineOffset, lineOffset + position.character);
    }

    private getLineOffsets() {
        if (this.lineOffsets) {
            return this.lineOffsets;
        }

        const lineOffsets = [];
        const text = this.svelteCode;
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
        this.logger.log('SvelteSnapshot:', this.fileName, '-', ...args);
    }

    private debug(...args: any[]) {
        this.logger.debug('SvelteSnapshot:', this.fileName, '-', ...args);
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

export class SvelteSnapshotManager {
    private snapshots = new Map<string, SvelteSnapshot>();

    constructor(
        private typescript: typeof ts,
        private projectService: ts.server.ProjectService,
        private svelteOptions: { namespace: string },
        private logger: Logger,
        private configManager: ConfigManager
    ) {
        this.patchProjectServiceReadFile();
    }

    get(fileName: string) {
        return this.snapshots.get(fileName);
    }

    create(fileName: string): SvelteSnapshot | undefined {
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
            this.logger.log(
                'Svelte snapshot was not found after trying to load script snapshot for',
                fileName
            );
            return; // should never get here
        }
        snapshot.setAndPatchScriptInfo(scriptInfo);
        this.snapshots.set(fileName, snapshot);
        return snapshot;
    }

    private patchProjectServiceReadFile() {
        const readFile = this.projectService.host.readFile;
        this.projectService.host.readFile = (path: string) => {
            // The following (very hacky) first two checks make sure that the ambient module definitions
            // that tell TS "every import ending with .svelte is a valid module" are removed.
            // They exist in svelte2tsx and svelte to make sure that people don't
            // get errors in their TS files when importing Svelte files and not using our TS plugin.
            // If someone wants to get back the behavior they can add an ambient module definition
            // on their own.
            const normalizedPath = path.replace(/\\/g, '/');
            if (normalizedPath.endsWith('node_modules/svelte/types/runtime/ambient.d.ts')) {
                return '';
            } else if (normalizedPath.endsWith('svelte2tsx/svelte-shims.d.ts')) {
                let originalText = readFile(path) || '';
                if (!originalText.includes('// -- start svelte-ls-remove --')) {
                    return originalText; // uses an older version of svelte2tsx
                }
                originalText =
                    originalText.substring(
                        0,
                        originalText.indexOf('// -- start svelte-ls-remove --')
                    ) +
                    originalText.substring(originalText.indexOf('// -- end svelte-ls-remove --'));
                return originalText;
            } else if (isSvelteFilePath(path) && this.configManager.getConfig().enable) {
                this.logger.debug('Read Svelte file:', path);
                const svelteCode = readFile(path) || '';
                try {
                    const isTsFile = true; // TODO check file contents? TS might be okay with importing ts into js.
                    const result = svelte2tsx(svelteCode, {
                        filename: path.split('/').pop(),
                        isTsFile,
                        mode: 'ts', // useNewTransformation
                        typingsNamespace: this.svelteOptions.namespace
                    });
                    const existingSnapshot = this.snapshots.get(path);
                    if (existingSnapshot) {
                        existingSnapshot.update(svelteCode, new SourceMapper(result.map.mappings));
                    } else {
                        this.snapshots.set(
                            path,
                            new SvelteSnapshot(
                                this.typescript,
                                path,
                                svelteCode,
                                new SourceMapper(result.map.mappings),
                                this.logger,
                                isTsFile
                            )
                        );
                    }
                    this.logger.log('Successfully read Svelte file contents of', path);
                    return result.code;
                } catch (e) {
                    this.logger.log('Error loading Svelte file:', path, ' Using fallback.');
                    this.logger.debug('Error:', e);
                    // Return something either way, else "X is not a module" errors will appear
                    // in the TS files that use this file.
                    return 'export default class extends Svelte2TsxComponent<any,any,any> {}';
                }
            } else {
                return readFile(path);
            }
        };
    }
}

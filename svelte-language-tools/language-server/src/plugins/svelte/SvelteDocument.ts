import { TraceMap } from '@jridgewell/trace-mapping';
import type { compile } from 'svelte/compiler';
import { CompileOptions } from 'svelte/types/compiler/interfaces';
import { PreprocessorGroup, Processed } from 'svelte/types/compiler/preprocess/types';
import { Position } from 'vscode-languageserver';
import { getPackageInfo, importSvelte } from '../../importPackage';
import {
    Document,
    DocumentMapper,
    extractScriptTags,
    extractStyleTag,
    FragmentMapper,
    IdentityMapper,
    isInTag,
    offsetAt,
    positionAt,
    SourceMapDocumentMapper,
    TagInformation
} from '../../lib/documents';
import { SvelteConfig } from '../../lib/documents/configLoader';
import { getLastPartOfPath, isNotNullOrUndefined } from '../../utils';

export type SvelteCompileResult = ReturnType<typeof compile>;

export enum TranspileErrorSource {
    Script = 'Script',
    Style = 'Style'
}

type PositionMapper = Pick<DocumentMapper, 'getGeneratedPosition' | 'getOriginalPosition'>;

/**
 * Represents a text document that contains a svelte component.
 */
export class SvelteDocument {
    private transpiledDoc: ITranspiledSvelteDocument | undefined;
    private compileResult: SvelteCompileResult | undefined;

    public script: TagInformation | null;
    public moduleScript: TagInformation | null;
    public style: TagInformation | null;
    public languageId = 'svelte';
    public version = 0;
    public uri = this.parent.uri;
    public get config() {
        return this.parent.configPromise;
    }

    constructor(private parent: Document) {
        this.script = this.parent.scriptInfo;
        this.moduleScript = this.parent.moduleScriptInfo;
        this.style = this.parent.styleInfo;
        this.version = this.parent.version;
    }

    getText() {
        return this.parent.getText();
    }

    getFilePath(): string {
        return this.parent.getFilePath() || '';
    }

    offsetAt(position: Position): number {
        return this.parent.offsetAt(position);
    }

    async getTranspiled(): Promise<ITranspiledSvelteDocument> {
        if (!this.transpiledDoc) {
            const {
                version: { major, minor }
            } = getPackageInfo('svelte', this.getFilePath());

            if (major > 3 || (major === 3 && minor >= 32)) {
                this.transpiledDoc = await TranspiledSvelteDocument.create(
                    this.parent,
                    await this.config
                );
            } else {
                this.transpiledDoc = await FallbackTranspiledSvelteDocument.create(
                    this.parent,
                    (
                        await this.config
                    )?.preprocess
                );
            }
        }
        return this.transpiledDoc;
    }

    async getCompiled(): Promise<SvelteCompileResult> {
        if (!this.compileResult) {
            this.compileResult = await this.getCompiledWith((await this.config)?.compilerOptions);
        }

        return this.compileResult;
    }

    async getCompiledWith(options: CompileOptions = {}): Promise<SvelteCompileResult> {
        const svelte = importSvelte(this.getFilePath());
        return svelte.compile((await this.getTranspiled()).getText(), options);
    }
}

export interface ITranspiledSvelteDocument extends PositionMapper {
    getText(): string;
}

export class TranspiledSvelteDocument implements ITranspiledSvelteDocument {
    static async create(document: Document, config: SvelteConfig | undefined) {
        if (!config?.preprocess) {
            return new TranspiledSvelteDocument(document.getText());
        }

        const filename = document.getFilePath() || '';
        const svelte = importSvelte(filename);
        const preprocessed = await svelte.preprocess(
            document.getText(),
            wrapPreprocessors(config?.preprocess),
            {
                filename
            }
        );

        if (preprocessed.code === document.getText()) {
            return new TranspiledSvelteDocument(document.getText());
        }

        return new TranspiledSvelteDocument(
            preprocessed.code,
            preprocessed.map
                ? new SourceMapDocumentMapper(
                      createTraceMap(preprocessed.map),
                      // The "sources" array only contains the Svelte filename, not its path.
                      // For getting generated positions, the sourcemap consumer wants an exact match
                      // of the source filepath. Therefore only pass in the filename here.
                      getLastPartOfPath(filename)
                  )
                : undefined
        );
    }

    constructor(private code: string, private mapper?: SourceMapDocumentMapper) {}

    getOriginalPosition(generatedPosition: Position): Position {
        return this.mapper?.getOriginalPosition(generatedPosition) || generatedPosition;
    }

    getText() {
        return this.code;
    }

    getGeneratedPosition(originalPosition: Position): Position {
        return this.mapper?.getGeneratedPosition(originalPosition) || originalPosition;
    }
}

/**
 * Only used when the user has an old Svelte version installed where source map support
 * for preprocessors is not built in yet.
 * This fallback version does not map correctly when there's both a module and instance script.
 * It isn't worth fixing these cases though now that Svelte ships a preprocessor with source maps.
 */
export class FallbackTranspiledSvelteDocument implements ITranspiledSvelteDocument {
    static async create(
        document: Document,
        preprocessors: PreprocessorGroup | PreprocessorGroup[] = []
    ) {
        const { transpiled, processedScripts, processedStyles } = await transpile(
            document,
            preprocessors
        );
        const scriptMapper = SvelteFragmentMapper.createScript(
            document,
            transpiled,
            processedScripts
        );
        const styleMapper = SvelteFragmentMapper.createStyle(document, transpiled, processedStyles);

        return new FallbackTranspiledSvelteDocument(
            document,
            transpiled,
            scriptMapper,
            styleMapper
        );
    }

    private fragmentInfos = [this.scriptMapper?.fragmentInfo, this.styleMapper?.fragmentInfo]
        .filter(isNotNullOrUndefined)
        .sort((i1, i2) => i1.end - i2.end);

    private constructor(
        private parent: Document,
        private transpiled: string,
        public scriptMapper: SvelteFragmentMapper | null,
        public styleMapper: SvelteFragmentMapper | null
    ) {}

    getOriginalPosition(generatedPosition: Position): Position {
        if (this.scriptMapper?.isInTranspiledFragment(generatedPosition)) {
            return this.scriptMapper.getOriginalPosition(generatedPosition);
        }
        if (this.styleMapper?.isInTranspiledFragment(generatedPosition)) {
            return this.styleMapper.getOriginalPosition(generatedPosition);
        }

        // Position is not in fragments, but we still need to account for
        // the length differences of the fragments before the position.
        let offset = offsetAt(generatedPosition, this.transpiled);
        for (const fragmentInfo of this.fragmentInfos) {
            if (offset > fragmentInfo.end) {
                offset += fragmentInfo.diff;
            }
        }
        return this.parent.positionAt(offset);
    }

    getURL(): string {
        return this.parent.getURL();
    }

    getText() {
        return this.transpiled;
    }

    getGeneratedPosition(originalPosition: Position): Position {
        const { styleInfo, scriptInfo } = this.parent;

        if (isInTag(originalPosition, scriptInfo) && this.scriptMapper) {
            return this.scriptMapper.getGeneratedPosition(originalPosition);
        }
        if (isInTag(originalPosition, styleInfo) && this.styleMapper) {
            return this.styleMapper.getGeneratedPosition(originalPosition);
        }

        // Add length difference of each fragment
        let offset = offsetAt(originalPosition, this.parent.getText());
        for (const fragmentInfo of this.fragmentInfos) {
            if (offset > fragmentInfo.end) {
                offset -= fragmentInfo.diff;
            }
        }

        return positionAt(offset, this.getText());
    }
}

export class SvelteFragmentMapper implements PositionMapper {
    static createStyle(originalDoc: Document, transpiled: string, processed: Processed[]) {
        return SvelteFragmentMapper.create(
            originalDoc,
            transpiled,
            originalDoc.styleInfo,
            extractStyleTag(transpiled),
            processed
        );
    }

    static createScript(originalDoc: Document, transpiled: string, processed: Processed[]) {
        const scriptInfo = originalDoc.scriptInfo || originalDoc.moduleScriptInfo;
        const maybeScriptTag = extractScriptTags(transpiled);
        const maybeScriptTagInfo =
            maybeScriptTag && (maybeScriptTag.script || maybeScriptTag.moduleScript);

        return SvelteFragmentMapper.create(
            originalDoc,
            transpiled,
            scriptInfo,
            maybeScriptTagInfo || null,
            processed
        );
    }

    private static create(
        originalDoc: Document,
        transpiled: string,
        originalTagInfo: TagInformation | null,
        transpiledTagInfo: TagInformation | null,
        processed: Processed[]
    ) {
        const sourceMapper =
            processed.length > 0
                ? SvelteFragmentMapper.createSourceMapper(processed, originalDoc)
                : new IdentityMapper(originalDoc.uri);

        if (originalTagInfo && transpiledTagInfo) {
            const sourceLength = originalTagInfo.container.end - originalTagInfo.container.start;
            const transpiledLength =
                transpiledTagInfo.container.end - transpiledTagInfo.container.start;
            const diff = sourceLength - transpiledLength;

            return new SvelteFragmentMapper(
                { end: transpiledTagInfo.container.end, diff },
                new FragmentMapper(originalDoc.getText(), originalTagInfo, originalDoc.uri),
                new FragmentMapper(transpiled, transpiledTagInfo, originalDoc.uri),
                sourceMapper
            );
        }

        return null;
    }

    private static createSourceMapper(processed: Processed[], originalDoc: Document) {
        return processed.reduce(
            (parent, processedSingle) =>
                processedSingle?.map
                    ? new SourceMapDocumentMapper(
                          createTraceMap(processedSingle.map),
                          originalDoc.uri,
                          parent
                      )
                    : new IdentityMapper(originalDoc.uri, parent),
            <DocumentMapper>(<any>undefined)
        );
    }

    private constructor(
        /**
         * End offset + length difference to original
         */
        public fragmentInfo: { end: number; diff: number },
        /**
         * Maps between full original source and fragment within that original.
         */
        private originalFragmentMapper: DocumentMapper,
        /**
         * Maps between full transpiled source and fragment within that transpiled.
         */
        private transpiledFragmentMapper: DocumentMapper,
        /**
         * Maps between original and transpiled, within fragment.
         */
        private sourceMapper: DocumentMapper
    ) {}

    isInTranspiledFragment(generatedPosition: Position): boolean {
        return this.transpiledFragmentMapper.isInGenerated(generatedPosition);
    }

    getOriginalPosition(generatedPosition: Position): Position {
        // Map the position to be relative to the transpiled fragment
        const positionInTranspiledFragment =
            this.transpiledFragmentMapper.getGeneratedPosition(generatedPosition);
        // Map the position, using the sourcemap, to the original position in the source fragment
        const positionInOriginalFragment = this.sourceMapper.getOriginalPosition(
            positionInTranspiledFragment
        );
        // Map the position to be in the original fragment's parent
        return this.originalFragmentMapper.getOriginalPosition(positionInOriginalFragment);
    }

    /**
     * Reversing `getOriginalPosition`
     */
    getGeneratedPosition(originalPosition: Position): Position {
        const positionInOriginalFragment =
            this.originalFragmentMapper.getGeneratedPosition(originalPosition);
        const positionInTranspiledFragment = this.sourceMapper.getGeneratedPosition(
            positionInOriginalFragment
        );
        return this.transpiledFragmentMapper.getOriginalPosition(positionInTranspiledFragment);
    }
}

/**
 * Wrap preprocessors and rethrow on errors with more info on where the error came from.
 */
function wrapPreprocessors(preprocessors: PreprocessorGroup | PreprocessorGroup[] = []) {
    preprocessors = Array.isArray(preprocessors) ? preprocessors : [preprocessors];
    return preprocessors.map((preprocessor) => {
        const wrappedPreprocessor: PreprocessorGroup = { markup: preprocessor.markup };

        if (preprocessor.script) {
            wrappedPreprocessor.script = async (args: any) => {
                try {
                    return await preprocessor.script!(args);
                } catch (e: any) {
                    e.__source = TranspileErrorSource.Script;
                    throw e;
                }
            };
        }

        if (preprocessor.style) {
            wrappedPreprocessor.style = async (args: any) => {
                try {
                    return await preprocessor.style!(args);
                } catch (e: any) {
                    e.__source = TranspileErrorSource.Style;
                    throw e;
                }
            };
        }

        return wrappedPreprocessor;
    });
}

async function transpile(
    document: Document,
    preprocessors: PreprocessorGroup | PreprocessorGroup[] = []
) {
    preprocessors = Array.isArray(preprocessors) ? preprocessors : [preprocessors];
    const processedScripts: Processed[] = [];
    const processedStyles: Processed[] = [];

    const wrappedPreprocessors = preprocessors.map((preprocessor) => {
        const wrappedPreprocessor: PreprocessorGroup = { markup: preprocessor.markup };

        if (preprocessor.script) {
            wrappedPreprocessor.script = async (args: any) => {
                try {
                    const res = await preprocessor.script!(args);
                    if (res && res.map) {
                        processedScripts.push(res);
                    }
                    return res;
                } catch (e: any) {
                    e.__source = TranspileErrorSource.Script;
                    throw e;
                }
            };
        }

        if (preprocessor.style) {
            wrappedPreprocessor.style = async (args: any) => {
                try {
                    const res = await preprocessor.style!(args);
                    if (res && res.map) {
                        processedStyles.push(res);
                    }
                    return res;
                } catch (e: any) {
                    e.__source = TranspileErrorSource.Style;
                    throw e;
                }
            };
        }

        return wrappedPreprocessor;
    });

    const svelte = importSvelte(document.getFilePath() || '');
    const result = await svelte.preprocess(document.getText(), wrappedPreprocessors, {
        filename: document.getFilePath() || ''
    });
    const transpiled = result.code || result.toString?.() || '';

    return { transpiled, processedScripts, processedStyles };
}

function createTraceMap(map: any): TraceMap {
    return new TraceMap(normalizeMap(map));

    function normalizeMap(map: any) {
        // We don't know what we get, could be a stringified sourcemap,
        // or a class which has the required properties on it, or a class
        // which we need to call toString() on to get the correct format.
        if (typeof map === 'string' || map.version) {
            return map;
        }
        return map.toString();
    }
}

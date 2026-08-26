export type PositionEncoding = 'utf-8' | 'utf-16';

export interface InitializeParams {
	/** The position encodings supported by TypeScript. The mapper must choose one of these encodings. */
	positionEncodings: PositionEncoding[];
	/** BCP 47 locale requested for diagnostics. */
	locale?: string;
}

export interface InitializeResult {
	/** The position encoding the mapper will use for all span mapping positions and diagnostic positions. */
	positionEncoding: PositionEncoding;
	/**
	 * The source identifier displayed for mapper-produced diagnostics.
	 * Must not be "ts", "tsc", "typescript", or any file extension TypeScript understands.
	 */
	diagnosticSource: string;
}

export interface OpenProjectParams {
	/** Absolute tsconfig path, or an empty string for a project without a config file. */
	configFileName: string;
	/** Opaque process-local handle assigned by TypeScript. */
	projectHandle: string;
	/** Object from the contentMappers entry, when specified. */
	options?: Record<string, unknown>;
	/** The project's effective compiler options. */
	compilerOptions: Record<string, unknown>;
}

export interface OpenProjectResult {
	/**
	 * Stable fingerprint of all dynamically discovered configuration that can affect transforms.
	 * Required, and only allowed, when the mapper declares `dynamicConfig: true`.
	 */
	configIdentity?: string;
	/**
	 * Absolute file names whose changes may alter configIdentity or transform output.
	 * May only be returned when the package declares `dynamicConfig: true`.
	 */
	watchedFiles?: string[];
	/** Diagnostics for invalid values in this mapper's contentMappers options object. */
	optionDiagnostics?: OptionDiagnostic[];
}

export interface OptionDiagnostic {
	/**
	 * Property names and nonnegative array indexes relative to the mapper entry's options object.
	 * An empty path reports the diagnostic on the options object itself.
	 */
	path: (string | number)[];
	messageText: string;
	code: number;
}

export interface TransformParams {
	fileName: string;
	/** Original content of the file to be transformed. */
	content: string;
	/** Project handle supplied in openProject. */
	projectHandle: string;
}

export type VirtualExtension =
	| '.js'
	| '.jsx'
	| '.mjs'
	| '.cjs'
	| '.ts'
	| '.tsx'
	| '.mts'
	| '.cts'
	| '.json';

export interface MappedOutput {
	/** Valid JS, JSX, TS, TSX, or JSON text that TypeScript can parse. */
	text: string;
	/** The virtual file extension that determines how TypeScript parses this output. */
	extension: VirtualExtension;
	/** Mappings between the original and transformed content. */
	mappings?: SpanMapping[];
}

export interface TransformResult extends MappedOutput {
	/** Parse errors in the original content. */
	diagnostics?: MapperDiagnostic[];
	/** Additional virtual files associated with this input. */
	supplemental?: MappedOutput[];
}

export interface CloseProjectParams {
	/** Project handle supplied in openProject. */
	projectHandle: string;
}

/** Positions and lengths are in the specified `positionEncoding`. */
export type SpanMapping = [
	virtualStart: number,
	virtualLength: number,
	originalStart: number,
	originalLength: number,
	kind: SpanMapKind,
	features?: SpanMapFeature,
];

export const SpanMapKind = {
	/** Virtual text has the same length and content as its counterpart in the original text. */
	Verbatim: 0,
	/** Virtual text may differ in length and content; diagnostics display the virtual text. */
	Atom: 1,
	/** Like `Atom`, but diagnostics display the original text instead. */
	Alias: 2,
} as const;

export type SpanMapKind = (typeof SpanMapKind)[keyof typeof SpanMapKind];

/** Controls which TypeScript language service features may use a span. */
export const SpanMapFeature = {
	None: 0,
	Hover: 1 << 0,
	SignatureHelp: 1 << 1,
	Completion: 1 << 2,
	Definition: 1 << 3,
	TypeDefinition: 1 << 4,
	Implementation: 1 << 5,
	References: 1 << 6,
	DocumentHighlights: 1 << 7,
	Rename: 1 << 8,
	CallHierarchy: 1 << 9,
	CodeActions: 1 << 10,
	Formatting: 1 << 11,
	InlayHints: 1 << 12,
	SemanticTokens: 1 << 13,
	FoldingRanges: 1 << 14,
	SelectionRanges: 1 << 15,
	LinkedEditing: 1 << 16,
	AutoInsert: 1 << 17,
	DocumentSymbols: 1 << 18,
	CodeLens: 1 << 19,
	/** Every language service feature. This is the default when `features` is omitted. */
	All: (1 << 20) - 1,
} as const;

export type SpanMapFeature = number;

/** Start and length are in the specified `positionEncoding`. */
export interface MapperDiagnostic {
	messageText: string;
	start: number;
	length: number;
	code: number;
}

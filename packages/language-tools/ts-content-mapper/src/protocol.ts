import type { ConvertToTsxResult } from '@astrojs/astro2tsx';

export type PositionEncoding = 'utf-8' | 'utf-16';

export interface InitializeParams {
	positionEncodings: PositionEncoding[];
}

export interface InitializeResult {
	positionEncoding: PositionEncoding;
	diagnosticSource: string;
}

export interface TransformParams {
	fileName: string;
	content: string;
	projectHandle: string;
}

export interface SupplementalOutput {
	text: string;
	extension: '.mjs' | '.mts';
	mappings: ConvertToTsxResult['mappings'];
}

export interface TransformResult {
	text: string;
	extension: '.tsx';
	mappings: ConvertToTsxResult['mappings'];
	diagnostics: MapperDiagnostic[];
	supplemental?: SupplementalOutput[];
}

export interface MapperDiagnostic {
	messageText: string;
	start: number;
	length: number;
	code: number;
}

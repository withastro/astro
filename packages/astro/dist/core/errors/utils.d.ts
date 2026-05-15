import type { YAMLException } from 'js-yaml';
import type { TomlError } from 'smol-toml';
import type { ErrorPayload as ViteErrorPayload } from 'vite';
/**
 * Get the line and character based on the offset
 * @param offset The index of the position
 * @param text The text for which the position should be retrieved
 */
export declare function positionAt(
	offset: number,
	text: string,
): {
	line: number;
	column: number;
};
export declare function isYAMLException(err: unknown): err is YAMLException;
/** Format YAML exceptions as Vite errors */
export declare function formatYAMLException(e: YAMLException): ViteErrorPayload['err'];
export declare function isTOMLError(err: unknown): err is TomlError;
/** Format TOML exceptions as Vite errors */
export declare function formatTOMLError(e: TomlError): ViteErrorPayload['err'];
/** Coalesce any throw variable to an Error instance. */
export declare function createSafeError(err: any): Error;
export declare function normalizeLF(code: string): string;

import type { YAMLParseError } from '@astrojs/internal-helpers/yaml';
import type { TomlError } from 'smol-toml';
import type { ErrorPayload as ViteErrorPayload } from 'vite';

export { isYAMLParseError } from '@astrojs/internal-helpers/yaml-error';
export * from '@astrojs/runtime/internal/core/errors/utils.js';

/** Format YAML exceptions as Vite errors */
export function formatYAMLParseError(e: YAMLParseError): ViteErrorPayload['err'] {
	const position = e.linePos?.[0];
	const loc = position
		? {
				line: position.line,
				column: position.col - 1,
			}
		: undefined;
	return {
		name: e.name,
		loc,
		message: e.message,
		stack: e.stack ?? '',
	};
}

export function isTOMLError(err: unknown): err is TomlError {
	return err instanceof Error && err.name === 'TomlError';
}

/** Format TOML exceptions as Vite errors */
export function formatTOMLError(e: TomlError): ViteErrorPayload['err'] {
	return {
		name: e.name,
		id: e.name,
		loc: { line: e.line + 1, column: e.column },
		message: e.message,
		stack: e.stack ?? '',
	};
}

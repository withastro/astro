import type { YAMLParseError } from 'yaml';

export function isYAMLParseError(err: unknown): err is YAMLParseError {
	return err instanceof Error && err.name === 'YAMLParseError';
}

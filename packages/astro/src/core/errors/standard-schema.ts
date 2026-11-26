import type { StandardSchemaV1 } from '@standard-schema/spec';

export function isStandardSchema(value: unknown): value is StandardSchemaV1 {
	return (
		typeof value === 'object' &&
		value !== null &&
		'~standard' in value &&
		typeof (value as StandardSchemaV1)['~standard']?.validate === 'function'
	);
}

export function formatIssuePath(path: StandardSchemaV1.Issue['path']): string {
	return (path ?? [])
		.map((segment) => String(typeof segment === 'object' ? segment.key : segment))
		.join('.');
}

export function formatSchemaIssues(issues: readonly StandardSchemaV1.Issue[]): Array<string> {
	return issues.map((issue) => `  **${formatIssuePath(issue.path)}**: ${issue.message}`);
}

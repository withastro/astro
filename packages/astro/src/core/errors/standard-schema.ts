import type { StandardSchemaV1 } from '@standard-schema/spec';

/**
 * Renders the path of a [Standard Schema](https://standardschema.dev) issue as a dotted
 * property path. Segments are either keys or `{ key }` objects, depending on the validator.
 */
export function formatIssuePath(path: StandardSchemaV1.Issue['path']): string {
	return (path ?? [])
		.map((segment) => String(typeof segment === 'object' ? segment.key : segment))
		.join('.');
}

/**
 * Formats validation issues from any Standard Schema validator into the bulleted list used
 * by Astro's schema errors.
 */
export function formatSchemaIssues(issues: readonly StandardSchemaV1.Issue[]): Array<string> {
	return issues.map((issue) => `  **${formatIssuePath(issue.path)}**: ${issue.message}`);
}

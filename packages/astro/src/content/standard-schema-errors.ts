import type { StandardSchemaV1 } from '@standard-schema/spec';

export function formatIssues(issues: ReadonlyArray<StandardSchemaV1.Issue>): string {
	return issues
		.map((issue) => {
			const segments = issue.path?.map((segment) =>
				typeof segment === 'object' ? String(segment.key) : String(segment),
			);
			const path = segments?.join('.') ?? '';
			return path ? `  **${path}**: ${issue.message}` : `  ${issue.message}`;
		})
		.join('\n');
}

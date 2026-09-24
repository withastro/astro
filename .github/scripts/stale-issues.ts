import { execSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
	options: {
		token: { type: 'string' },
	},
});

if (!values.token) {
	console.error('Usage: node --experimental-strip-types stale-issues.ts --token <github-token>');
	process.exit(1);
}

const DAYS_INACTIVE = 3;
// Convert days to milliseconds: days * hours * minutes * seconds * ms
const cutoff = new Date(Date.now() - DAYS_INACTIVE * 24 * 60 * 60 * 1000);

const issues: { number: number; updatedAt: string }[] = JSON.parse(
	execSync(
		`gh issue list --label "triage: needs reproduction" --state open --json number,updatedAt --limit 500 --repo withastro/astro`,
		{ encoding: 'utf-8', env: { ...process.env, GH_TOKEN: values.token } },
	),
);

const stale = issues
	.filter((issue) => new Date(issue.updatedAt) < cutoff)
	.map((issue) => issue.number);

// biome-ignore lint/suspicious/noConsole: valid for CI
console.log(JSON.stringify(stale));

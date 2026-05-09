import * as v from 'valibot';

const REPO = process.env.GITHUB_REPOSITORY || 'withastro/astro';
export const GITHUB_TOKEN_BASE = process.env.GITHUB_TOKEN;

// Intentionally not exported, GITHUB_TOKEN_BASE should be enough anywhere else.
const GITHUB_TOKEN_PRIVILEGED = process.env.FREDKBOT_GITHUB_TOKEN;

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

function headers(token: string): Record<string, string> {
	return {
		Authorization: `token ${token}`,
		'Content-Type': 'application/json',
		Accept: 'application/vnd.github+json',
	};
}

export const issueDetailsSchema = v.object({
	title: v.string(),
	body: v.string(),
	author: v.object({ login: v.string() }),
	labels: v.array(v.looseObject({ name: v.string() })),
	createdAt: v.string(),
	state: v.string(),
	number: v.number(),
	url: v.string(),
	comments: v.array(
		v.looseObject({
			author: v.object({ login: v.string() }),
			authorAssociation: v.string(),
			body: v.string(),
			createdAt: v.string(),
		}),
	),
});
export type IssueDetails = v.InferOutput<typeof issueDetailsSchema>;

export const repoLabelSchema = v.object({
	name: v.string(),
	description: v.nullable(v.string()),
});

export type RepoLabel = v.InferOutput<typeof repoLabelSchema>;

export async function fetchIssueDetails(issueNumber: number): Promise<IssueDetails> {
	assert(GITHUB_TOKEN_BASE, `GITHUB_TOKEN env token is required.`);
	const [issueRes, commentsRes] = await Promise.all([
		fetch(`https://api.github.com/repos/${REPO}/issues/${issueNumber}`, {
			headers: headers(GITHUB_TOKEN_BASE),
		}),
		fetch(`https://api.github.com/repos/${REPO}/issues/${issueNumber}/comments?per_page=100`, {
			headers: headers(GITHUB_TOKEN_BASE),
		}),
	]);

	if (!issueRes.ok) {
		throw new Error(
			`Failed to fetch issue ${issueNumber} (HTTP ${issueRes.status}): ${await issueRes.text()}`,
		);
	}
	if (!commentsRes.ok) {
		throw new Error(
			`Failed to fetch comments for issue ${issueNumber} (HTTP ${commentsRes.status}): ${await commentsRes.text()}`,
		);
	}

	const issue = (await issueRes.json()) as Record<string, unknown>;
	const rawComments = (await commentsRes.json()) as Record<string, unknown>[];

	// Map from REST API snake_case to the camelCase shape the workflow expects
	return v.parse(issueDetailsSchema, {
		title: issue.title,
		body: issue.body ?? '',
		author: { login: (issue.user as Record<string, unknown>)?.login },
		labels: issue.labels,
		createdAt: issue.created_at,
		state: issue.state,
		number: issue.number,
		url: issue.html_url,
		comments: rawComments.map((c) => ({
			author: { login: (c.user as Record<string, unknown>)?.login },
			authorAssociation: c.author_association,
			body: c.body,
			createdAt: c.created_at,
		})),
	});
}

export async function fetchRepoLabels(): Promise<{
	priorityLabels: RepoLabel[];
	packageLabels: RepoLabel[];
}> {
	assert(GITHUB_TOKEN_BASE, `GITHUB_TOKEN env token is required.`);
	const allLabels: RepoLabel[] = [];
	let page = 1;

	// Paginate through all labels (100 per page)
	while (true) {
		const res = await fetch(
			`https://api.github.com/repos/${REPO}/labels?per_page=100&page=${page}`,
			{ headers: headers(GITHUB_TOKEN_BASE) },
		);
		if (!res.ok) {
			throw new Error(`Failed to fetch labels (HTTP ${res.status}): ${await res.text()}`);
		}
		const batch = v.parse(v.array(repoLabelSchema), await res.json());
		allLabels.push(...batch);
		if (batch.length < 100) break;
		page++;
	}

	return {
		priorityLabels: allLabels.filter((l) => /^- P\d/.test(l.name)),
		packageLabels: allLabels.filter((l) => l.name.startsWith('pkg:')),
	};
}

export async function postGitHubComment(issueNumber: number, body: string): Promise<void> {
	assert(GITHUB_TOKEN_PRIVILEGED, `FREDKBOT_GITHUB_TOKEN  token is required.`);
	const res = await fetch(`https://api.github.com/repos/${REPO}/issues/${issueNumber}/comments`, {
		method: 'POST',
		headers: headers(GITHUB_TOKEN_PRIVILEGED),
		body: JSON.stringify({ body }),
	});
	if (!res.ok) {
		throw new Error(`Failed to post comment (HTTP ${res.status}): ${await res.text()}`);
	}
}

export async function addGitHubLabels(issueNumber: number, labels: string[]): Promise<void> {
	assert(GITHUB_TOKEN_PRIVILEGED, `FREDKBOT_GITHUB_TOKEN  token is required.`);
	const res = await fetch(`https://api.github.com/repos/${REPO}/issues/${issueNumber}/labels`, {
		method: 'POST',
		headers: headers(GITHUB_TOKEN_PRIVILEGED),
		body: JSON.stringify({ labels }),
	});
	if (!res.ok) {
		throw new Error(`Failed to add labels (HTTP ${res.status}): ${await res.text()}`);
	}
}

export async function removeGitHubLabel(issueNumber: number, label: string): Promise<void> {
	assert(GITHUB_TOKEN_PRIVILEGED, `FREDKBOT_GITHUB_TOKEN  token is required.`);
	const res = await fetch(
		`https://api.github.com/repos/${REPO}/issues/${issueNumber}/labels/${encodeURIComponent(label)}`,
		{
			method: 'DELETE',
			headers: headers(GITHUB_TOKEN_PRIVILEGED),
		},
	);
	if (!res.ok && res.status !== 404) {
		throw new Error(`Failed to remove label (HTTP ${res.status}): ${await res.text()}`);
	}
}

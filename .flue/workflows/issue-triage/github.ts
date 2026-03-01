import * as v from 'valibot';

const REPO = 'withastro/astro';

function headers(): Record<string, string> {
	const token = process.env.FREDKBOT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
	if (!token) throw new Error('token is not set');
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
	const [issueRes, commentsRes] = await Promise.all([
		fetch(`https://api.github.com/repos/${REPO}/issues/${issueNumber}`, { headers: headers() }),
		fetch(`https://api.github.com/repos/${REPO}/issues/${issueNumber}/comments?per_page=100`, {
			headers: headers(),
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
	const allLabels: RepoLabel[] = [];
	let page = 1;

	// Paginate through all labels (100 per page)
	while (true) {
		const res = await fetch(
			`https://api.github.com/repos/${REPO}/labels?per_page=100&page=${page}`,
			{ headers: headers() },
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
	const res = await fetch(`https://api.github.com/repos/${REPO}/issues/${issueNumber}/comments`, {
		method: 'POST',
		headers: headers(),
		body: JSON.stringify({ body }),
	});
	if (!res.ok) {
		throw new Error(`Failed to post comment (HTTP ${res.status}): ${await res.text()}`);
	}
}

export async function addGitHubLabels(issueNumber: number, labels: string[]): Promise<void> {
	const res = await fetch(`https://api.github.com/repos/${REPO}/issues/${issueNumber}/labels`, {
		method: 'POST',
		headers: headers(),
		body: JSON.stringify({ labels }),
	});
	if (!res.ok) {
		throw new Error(`Failed to add labels (HTTP ${res.status}): ${await res.text()}`);
	}
}

export async function removeGitHubLabel(issueNumber: number, label: string): Promise<void> {
	const res = await fetch(
		`https://api.github.com/repos/${REPO}/issues/${issueNumber}/labels/${encodeURIComponent(label)}`,
		{
			method: 'DELETE',
			headers: headers(),
		},
	);
	if (!res.ok && res.status !== 404) {
		throw new Error(`Failed to remove label (HTTP ${res.status}): ${await res.text()}`);
	}
}

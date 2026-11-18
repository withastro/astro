const MAINTAINER_PERMISSIONS = new Set(['ADMIN', 'MAINTAIN', 'WRITE']);

const CLOSING_ISSUES_QUERY = `query ($owner: String!, $repo: String!, $number: Int!, $after: String) {
	repository(owner: $owner, name: $repo) {
		pullRequest(number: $number) {
			state
			isDraft
			closingIssuesReferences(first: 100, after: $after) {
				pageInfo { hasNextPage endCursor }
				nodes { number }
			}
		}
	}
}`;

const ISSUE_REFERENCES_QUERY = `query ($owner: String!, $repo: String!, $number: Int!, $after: String) {
	repository(owner: $owner, name: $repo) {
		issue(number: $number) {
			state
			closedByPullRequestsReferences(first: 100, after: $after) {
				pageInfo { hasNextPage endCursor }
				nodes {
					number
					state
					isDraft
					authorAssociation
					author { login }
				}
			}
		}
	}
}`;

const OPEN_PULL_REQUESTS_QUERY = `query ($owner: String!, $repo: String!, $after: String) {
	repository(owner: $owner, name: $repo) {
		pullRequests(states: OPEN, first: 100, after: $after) {
			pageInfo { hasNextPage endCursor }
			nodes {
				number
				isDraft
				authorAssociation
				author { login }
			}
		}
	}
}`;

const COLLABORATOR_PERMISSION_QUERY = `query ($owner: String!, $repo: String!, $login: String!) {
	repository(owner: $owner, name: $repo) {
		collaborators(first: 1, login: $login) {
			edges { permission }
		}
	}
}`;

async function getPullRequest(github, owner, repo, number) {
	const issues = [];
	let state;
	let isDraft;
	let after = null;

	do {
		const { repository } = await github.graphql(CLOSING_ISSUES_QUERY, {
			owner,
			repo,
			number,
			after,
		});
		const pullRequest = repository.pullRequest;
		({ state, isDraft } = pullRequest);
		issues.push(...pullRequest.closingIssuesReferences.nodes);
		after = pullRequest.closingIssuesReferences.pageInfo.hasNextPage
			? pullRequest.closingIssuesReferences.pageInfo.endCursor
			: null;
	} while (after);

	return { state, isDraft, issues };
}

async function getIssueReferences(github, owner, repo, number) {
	const pullRequests = [];
	let state;
	let after = null;

	do {
		const { repository } = await github.graphql(ISSUE_REFERENCES_QUERY, {
			owner,
			repo,
			number,
			after,
		});
		const issue = repository.issue;
		state = issue.state;
		pullRequests.push(...issue.closedByPullRequestsReferences.nodes);
		after = issue.closedByPullRequestsReferences.pageInfo.hasNextPage
			? issue.closedByPullRequestsReferences.pageInfo.endCursor
			: null;
	} while (after);

	return { state, pullRequests };
}

async function getOpenPullRequests(github, owner, repo) {
	const pullRequests = [];
	let after = null;

	do {
		const { repository } = await github.graphql(OPEN_PULL_REQUESTS_QUERY, {
			owner,
			repo,
			after,
		});
		pullRequests.push(...repository.pullRequests.nodes);
		after = repository.pullRequests.pageInfo.hasNextPage
			? repository.pullRequests.pageInfo.endCursor
			: null;
	} while (after);

	return pullRequests;
}

async function isMaintainer({ github, owner, repo, pr, cache, core }) {
	if (pr.authorAssociation === 'OWNER') return true;
	if (pr.authorAssociation !== 'MEMBER' && pr.authorAssociation !== 'COLLABORATOR') return false;

	const login = pr.author?.login;
	if (!login) return true;
	if (cache.has(login)) return cache.get(login);

	try {
		const { repository } = await github.graphql(COLLABORATOR_PERMISSION_QUERY, {
			owner,
			repo,
			login,
		});
		const permission = repository.collaborators.edges[0]?.permission;
		// When the lookup returns no edge, keep the pull request because access cannot be confirmed.
		const maintainer = permission ? MAINTAINER_PERMISSIONS.has(permission) : true;
		cache.set(login, maintainer);
		return maintainer;
	} catch (error) {
		core.warning(
			`Could not read the permission of @${login}. Skipping their pull requests. ${error.message}`,
		);
		cache.set(login, true);
		return true;
	}
}

function formatIssueList(numbers) {
	const labels = numbers.map((number) => `#${number}`);
	if (labels.length === 1) return labels[0];
	if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
	return `${labels.slice(0, -1).join(', ')}, and ${labels.at(-1)}`;
}

function duplicateComment(pr, fixes) {
	const numbers = fixes.map((fix) => fix.issue);
	const mergedNumbers = [...new Set(fixes.map((fix) => fix.merged))];
	const subject = numbers.length === 1 ? 'issue' : 'issues';
	const verb = numbers.length === 1 ? 'was' : 'were';
	const location = mergedNumbers.length === 1 ? `#${mergedNumbers[0]}` : 'merged pull requests';
	const sentence = `${subject} ${formatIssueList(numbers)} ${verb} already fixed in ${location}, so we closed this PR as a duplicate. Thanks for taking the time to contribute.`;
	const body = `${sentence}

If this PR covers something the merged changes do not, leave a comment and a maintainer can reopen it.`;

	if (!pr.author?.login) return `${body[0].toUpperCase()}${body.slice(1)}`;
	return `Hi @${pr.author.login}, ${body}`;
}

async function closeDuplicate({ github, owner, repo, pr, fixes, core }) {
	// Close before commenting so a pull request closed by someone else does not receive a duplicate notice.
	await github.rest.pulls.update({
		owner,
		repo,
		pull_number: pr.number,
		state: 'closed',
	});
	await github.rest.issues.createComment({
		owner,
		repo,
		issue_number: pr.number,
		body: duplicateComment(pr, fixes),
	});
	core.info(`Closed #${pr.number} as a duplicate.`);
}

async function closeAfterMerge({ github, context, core }) {
	const { owner, repo } = context.repo;
	const mergedNumber = context.payload.pull_request.number;
	const merged = await getPullRequest(github, owner, repo, mergedNumber);
	const mergedIssues = new Set();
	const permissionCache = new Map();
	const candidates = new Map();

	for (const issue of merged.issues) {
		const { state, pullRequests } = await getIssueReferences(github, owner, repo, issue.number);
		// A merge into another branch or a reopened issue leaves the issue open, so it is not fixed.
		if (state !== 'CLOSED') continue;
		mergedIssues.add(issue.number);
		for (const pr of pullRequests) {
			if (pr.number === mergedNumber || pr.state !== 'OPEN' || pr.isDraft) continue;
			if (await isMaintainer({ github, owner, repo, pr, cache: permissionCache, core })) continue;
			candidates.set(pr.number, pr);
		}
	}

	for (const pr of candidates.values()) {
		try {
			const current = await getPullRequest(github, owner, repo, pr.number);
			if (current.state !== 'OPEN' || current.isDraft || current.issues.length === 0) continue;
			if (!current.issues.every((issue) => mergedIssues.has(issue.number))) continue;

			await closeDuplicate({
				github,
				owner,
				repo,
				pr,
				fixes: current.issues.map((issue) => ({ issue: issue.number, merged: mergedNumber })),
				core,
			});
		} catch (error) {
			core.warning(`Could not close #${pr.number}. ${error.message}`);
		}
	}
}

async function sweep({ github, context, core }) {
	const { owner, repo } = context.repo;
	const permissionCache = new Map();
	const openPullRequests = await getOpenPullRequests(github, owner, repo);

	for (const pr of openPullRequests) {
		if (pr.isDraft) continue;
		if (await isMaintainer({ github, owner, repo, pr, cache: permissionCache, core })) continue;

		try {
			const current = await getPullRequest(github, owner, repo, pr.number);
			if (current.state !== 'OPEN' || current.isDraft || current.issues.length === 0) continue;

			const fixes = [];
			for (const issue of current.issues) {
				const references = await getIssueReferences(github, owner, repo, issue.number);
				const merged = references.pullRequests.find(
					(reference) => reference.state === 'MERGED' && reference.number !== pr.number,
				);
				// A reopened issue means the merged reference no longer makes this pull request a duplicate.
				if (references.state !== 'CLOSED' || !merged) break;
				fixes.push({ issue: issue.number, merged: merged.number });
			}

			if (fixes.length !== current.issues.length) continue;

			await closeDuplicate({ github, owner, repo, pr, fixes, core });
		} catch (error) {
			core.warning(`Could not close #${pr.number}. ${error.message}`);
		}
	}
}

export async function run({ github, context, core }) {
	if (context.eventName !== 'pull_request_target') {
		return sweep({ github, context, core });
	}
	if (!context.payload.pull_request.merged) return;
	return closeAfterMerge({ github, context, core });
}

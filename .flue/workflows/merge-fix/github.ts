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

interface WorkflowRun {
	id: number;
	status: string;
	conclusion: string | null;
	name: string;
}

/**
 * Fetch the most recent failed CI run for a given branch.
 */
async function getFailedCIRun(branch: string): Promise<WorkflowRun | null> {
	const res = await fetch(
		`https://api.github.com/repos/${REPO}/actions/runs?branch=${encodeURIComponent(branch)}&status=failure&per_page=5`,
		{ headers: headers() },
	);
	if (!res.ok) {
		console.error(`Failed to fetch workflow runs (HTTP ${res.status}): ${await res.text()}`);
		return null;
	}
	const data = (await res.json()) as { workflow_runs: WorkflowRun[] };
	// Find the most recent CI run (not the Merge Fix run itself)
	return data.workflow_runs.find((r) => r.name === 'CI') ?? null;
}

/**
 * Fetch the failed job logs for a workflow run.
 * Returns the log text truncated to a reasonable size for the AI.
 */
export async function fetchCIFailureLogs(branch: string): Promise<string> {
	const run = await getFailedCIRun(branch);
	if (!run) {
		return 'No failed CI run found for this branch. Try running `pnpm build` and checking for build errors.';
	}

	// Get jobs for this run
	const jobsRes = await fetch(
		`https://api.github.com/repos/${REPO}/actions/runs/${run.id}/jobs?filter=failed`,
		{ headers: headers() },
	);
	if (!jobsRes.ok) {
		return `Failed to fetch jobs (HTTP ${jobsRes.status}). Run ID: ${run.id}`;
	}
	const jobsData = (await jobsRes.json()) as {
		jobs: Array<{
			id: number;
			name: string;
			conclusion: string;
			steps: Array<{ name: string; conclusion: string }>;
		}>;
	};

	const failedJobs = jobsData.jobs.filter((j) => j.conclusion === 'failure');
	if (failedJobs.length === 0) {
		return `CI run ${run.id} has no failed jobs.`;
	}

	// Fetch logs for each failed job
	const logParts: string[] = [];
	logParts.push(`CI Run: ${run.id}`);
	logParts.push(`Failed jobs: ${failedJobs.map((j) => j.name).join(', ')}`);
	logParts.push('');

	for (const job of failedJobs) {
		const logRes = await fetch(`https://api.github.com/repos/${REPO}/actions/jobs/${job.id}/logs`, {
			headers: headers(),
			redirect: 'follow',
		});
		if (!logRes.ok) {
			logParts.push(`## ${job.name}\nFailed to fetch logs (HTTP ${logRes.status})`);
			continue;
		}
		const logText = await logRes.text();
		// Truncate to last 5000 chars per job — the failures are at the end
		const truncated = logText.length > 5000 ? '...(truncated)\n' + logText.slice(-5000) : logText;
		logParts.push(`## ${job.name}\n${truncated}`);
	}

	// Cap total size to avoid blowing up the prompt
	const combined = logParts.join('\n\n');
	if (combined.length > 20000) {
		return combined.slice(0, 20000) + '\n...(truncated)';
	}
	return combined;
}

export async function postPRComment(prNumber: number, body: string): Promise<void> {
	const res = await fetch(`https://api.github.com/repos/${REPO}/issues/${prNumber}/comments`, {
		method: 'POST',
		headers: headers(),
		body: JSON.stringify({ body }),
	});
	if (!res.ok) {
		console.error(`Failed to post comment (HTTP ${res.status}): ${await res.text()}`);
	}
}

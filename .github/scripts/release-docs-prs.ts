/**
 * Posts a review comment on each release PR, listing the open docs PRs labeled
 * for its release line.
 *
 * Usage: `node .github/scripts/release-docs-prs.ts [--pr <number>] [--dry-run]`.
 * Without `--pr`, it updates every open release PR.
 */
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const DOCS_REPOSITORY = 'withastro/docs';
const DOCS_STABLE_BRANCH = 'main';
const FRAMEWORK_PACKAGE = 'astro';
/** The branches Changesets opens release PRs from, one per release line. */
const RELEASE_BRANCHES = {
	stable: 'changeset-release/main',
	prerelease: 'changeset-release/next',
} as const;
const RELEASE_LABELS = {
	patch: 'patch-release',
	minor: 'minor-release',
	major: 'major-release',
} as const;
type ReleaseType = keyof typeof RELEASE_LABELS;
/** A stable release also ships the docs waiting for a smaller release type. */
const STABLE_RELEASE_LABELS: Record<ReleaseType, string[]> = {
	patch: [RELEASE_LABELS.patch],
	minor: [RELEASE_LABELS.patch, RELEASE_LABELS.minor],
	major: [RELEASE_LABELS.patch, RELEASE_LABELS.minor, RELEASE_LABELS.major],
};
/** Umbrella PRs bundle the docs of a release, from a branch named after the base they merge into. */
const UMBRELLA_BRANCH_PREFIX = 'umbrella/';
/** The marker in which an umbrella's description records the release PR it ships with. */
const UMBRELLA_RELEASE_PR_MARKER = /^<!-- release-assistant:release-pr=(\d+) -->$/m;
const COMMENT_MARKER = '<!-- release-docs-prs -->';
/** The heading Changesets writes in a release PR body for each released package. */
const PACKAGE_HEADING = /^## ((?:@[^/\s]+\/)?[^@\s]+)@(\S+)\s*$/gm;
const SEMVER_CORE = /^(\d+)\.(\d+)\.(\d+)/;

type ReleasePullRequest = { number: number; body: string | null; headBranch: string };

type DocsPullRequest = {
	number: number;
	isDraft: boolean;
	baseBranch: string;
	headBranch: string;
	headRepository: string | null;
	labels: string[];
	body: string | null;
};

type OtherReleasePr = { number: number; isMerged: boolean };

type UmbrellaPullRequest = DocsPullRequest & { otherReleasePr: OtherReleasePr | null };

const { values } = parseArgs({
	options: { pr: { type: 'string' }, 'dry-run': { type: 'boolean', default: false } },
});
listDocsPrsOnReleasePrs({
	repository: process.env.GITHUB_REPOSITORY ?? 'withastro/astro',
	releasePrNumber: values.pr === undefined ? null : parsePrNumber(values.pr),
	isDryRun: values['dry-run'],
});

/**
 * Parses the value of the `--pr` option.
 *
 * @throws {Error} When the value is not a positive integer.
 */
function parsePrNumber(value: string) {
	const prNumber = Number(value);
	if (!Number.isSafeInteger(prNumber) || prNumber <= 0) {
		throw new Error(`--pr must be a pull request number. Got: "${value}".`);
	}
	return prNumber;
}

/**
 * Posts or edits the review comment listing the docs PRs on one release PR, or
 * on every open release PR when `releasePrNumber` is `null`.
 *
 * With `isDryRun`, it prints the comments instead.
 */
function listDocsPrsOnReleasePrs({
	repository,
	releasePrNumber,
	isDryRun,
}: {
	repository: string;
	releasePrNumber: number | null;
	isDryRun: boolean;
}) {
	const releasePrNumbers =
		releasePrNumber === null ? getOpenReleasePrNumbers(repository) : [releasePrNumber];
	if (releasePrNumbers.length === 0) {
		console.info('No release PR is open.');
		return;
	}

	const docsPrs = getOpenDocsPullRequests();
	for (const prNumber of releasePrNumbers) {
		const releasePr = getReleasePullRequest(repository, prNumber);
		const body = buildComment(repository, releasePr, docsPrs);
		if (isDryRun) console.info(`Review comment on #${releasePr.number}:\n\n${body}\n`);
		else upsertReview(repository, releasePr.number, body);
	}
}

function getOpenReleasePrNumbers(repository: string) {
	const [owner] = repository.split('/');
	return Object.values(RELEASE_BRANCHES).flatMap((branch) =>
		callGitHubApi<number>([
			`repos/${repository}/pulls?state=open&head=${owner}:${branch}`,
			'--jq',
			'.[].number',
		]),
	);
}

function buildComment(
	repository: string,
	releasePr: ReleasePullRequest,
	openDocsPrs: DocsPullRequest[],
) {
	const labels = getReleaseLabels(releasePr);
	const docsPrs = openDocsPrs.filter((pr) => pr.labels.some((label) => labels.includes(label)));
	const umbrellas = docsPrs.filter(isUmbrella).map((umbrella) => ({
		...umbrella,
		otherReleasePr: getOtherReleasePr(repository, umbrella.body, releasePr.number),
	}));
	const possibleMatches = docsPrs.filter((pr) => !isUmbrella(pr));
	return renderComment({ labels, umbrellas, possibleMatches });
}

/**
 * Gets a PR of `repository`, checked to be a release PR.
 *
 * @throws {Error} When the PR does not come from one of the {@link RELEASE_BRANCHES} of `repository`.
 */
function getReleasePullRequest(repository: string, prNumber: number): ReleasePullRequest {
	const [pr] = callGitHubApi<ReleasePullRequest & { headRepository: string | null }>([
		`repos/${repository}/pulls/${prNumber}`,
		'--jq',
		'{number, body, headBranch: .head.ref, headRepository: .head.repo.full_name}',
	]);
	const releaseBranches: string[] = Object.values(RELEASE_BRANCHES);
	if (pr.headRepository !== repository || !releaseBranches.includes(pr.headBranch)) {
		throw new Error(
			`#${prNumber} is not a release PR: its head is ${pr.headRepository}:${pr.headBranch}.`,
		);
	}
	return pr;
}

/**
 * Gets the docs labels of the release line of a release PR: the prerelease
 * line ships the prerelease docs, and the stable line the docs of its release
 * type and of the smaller ones.
 */
function getReleaseLabels({ headBranch, body }: ReleasePullRequest): string[] {
	if (headBranch === RELEASE_BRANCHES.prerelease) return [RELEASE_LABELS.major];
	return STABLE_RELEASE_LABELS[getFrameworkReleaseType(body)];
}

/**
 * Reads the release type of {@link FRAMEWORK_PACKAGE} in a release PR body.
 *
 * @returns The release type of its version, or `patch` when the body does not release it.
 * @throws {Error} When its version is not semantic.
 */
function getFrameworkReleaseType(releasePrBody: string | null): ReleaseType {
	const [, , version] =
		[...(releasePrBody ?? '').matchAll(PACKAGE_HEADING)].find(
			([, name]) => name === FRAMEWORK_PACKAGE,
		) ?? [];
	if (version === undefined) return 'patch';

	const [, , minor, patch] = version.match(SEMVER_CORE) ?? [];
	if (patch === undefined) {
		throw new Error(`Expected a semantic version for ${FRAMEWORK_PACKAGE}, got "${version}".`);
	}
	if (Number(patch) > 0) return 'patch';
	if (Number(minor) > 0) return 'minor';
	return 'major';
}

function getOpenDocsPullRequests() {
	return callGitHubApi<DocsPullRequest>([
		'--paginate',
		`repos/${DOCS_REPOSITORY}/pulls?state=open&per_page=100`,
		'--jq',
		'.[] | {number, isDraft: .draft, baseBranch: .base.ref, headBranch: .head.ref, headRepository: .head.repo.full_name, labels: [.labels[].name], body}',
	]);
}

function isUmbrella({ headRepository, headBranch }: DocsPullRequest) {
	return headRepository === DOCS_REPOSITORY && headBranch.startsWith(UMBRELLA_BRANCH_PREFIX);
}

/**
 * Gets the release PR an umbrella records in its description, and whether it is merged.
 *
 * @returns `null` when the umbrella records no release PR, or records `releasePrNumber`.
 */
function getOtherReleasePr(
	repository: string,
	umbrellaBody: string | null,
	releasePrNumber: number,
): OtherReleasePr | null {
	const recordedNumber = Number(umbrellaBody?.match(UMBRELLA_RELEASE_PR_MARKER)?.[1]);
	if (!recordedNumber || recordedNumber === releasePrNumber) return null;

	const [isMerged] = callGitHubApi<boolean>([
		`repos/${repository}/pulls/${recordedNumber}`,
		'--jq',
		'.merged',
	]);
	return { number: recordedNumber, isMerged };
}

function renderComment({
	labels,
	umbrellas,
	possibleMatches,
}: {
	labels: string[];
	umbrellas: UmbrellaPullRequest[];
	possibleMatches: DocsPullRequest[];
}) {
	const header = [
		COMMENT_MARKER,
		'## Docs PRs',
		`Open PRs in \`${DOCS_REPOSITORY}\` labeled ${formatList(labels.map((label) => `\`${label}\``))}.`,
	];
	if (umbrellas.length === 0 && possibleMatches.length === 0) {
		return [...header, 'None.'].join('\n\n');
	}

	return [
		...header,
		...renderSection(
			'### Umbrellas',
			'The docs accepted for a release.',
			umbrellas.map(renderUmbrella),
		),
		...renderSection(
			'### Possible matches',
			'These PRs may wait for a later release.',
			possibleMatches.map((pr) => renderPossibleMatch(pr, labels)),
		),
	].join('\n\n');
}

function renderSection(heading: string, description: string, items: string[]) {
	return items.length === 0 ? [] : [heading, description, items.join('\n')];
}

function renderUmbrella({ otherReleasePr, ...umbrella }: UmbrellaPullRequest) {
	const item = renderItem(umbrella);
	// Without another release PR recorded, the umbrella ships with this one.
	if (otherReleasePr === null) return item;
	if (!otherReleasePr.isMerged) return `${item}: ships with #${otherReleasePr.number}.`;
	// A maintainer merges an umbrella after its release, so it can still be open for the next one.
	return `${item}: released with #${otherReleasePr.number}. Merge it, so the docs of this release can join a new umbrella.`;
}

function renderPossibleMatch(pr: DocsPullRequest, releaseLabels: string[]) {
	const details = [
		...pr.labels.filter((label) => releaseLabels.includes(label)).map((label) => `\`${label}\``),
		...(pr.isDraft ? ['draft'] : []),
		...(pr.baseBranch === DOCS_STABLE_BRANCH ? [] : [`base \`${pr.baseBranch}\``]),
	];
	return `${renderItem(pr)} (${details.join(', ')})`;
}

function renderItem({ number }: DocsPullRequest) {
	// GitHub shows the title of a PR next to its reference in a list.
	return `- ${DOCS_REPOSITORY}#${number}`;
}

/** Joins the items with "or", and with commas from three items: `a, b, or c`. */
function formatList(items: string[]) {
	if (items.length <= 2) return items.join(' or ');
	return `${items.slice(0, -1).join(', ')}, or ${items.at(-1)}`;
}

/** Posts `body` as a review comment on the PR, or edits the one a previous run posted. */
function upsertReview(repository: string, prNumber: number, body: string) {
	// Unlike an issue comment, a review appears in the sidebar of the PR. GitHub
	// cannot delete a submitted review, so later runs edit it.
	const reviews = `repos/${repository}/pulls/${prNumber}/reviews`;
	const [reviewId] = callGitHubApi<number>([
		'--paginate',
		reviews,
		'--jq',
		`.[] | select(.user.type == "Bot" and (.body | startswith("${COMMENT_MARKER}"))) | .id`,
	]);
	const endpoint =
		reviewId === undefined
			? ['--method', 'POST', reviews, '--raw-field', 'event=COMMENT']
			: ['--method', 'PUT', `${reviews}/${reviewId}`];
	callGitHubApi([...endpoint, '--raw-field', `body=${body}`, '--jq', '.id']);
}

/**
 * Calls the GitHub API through the `gh` CLI.
 *
 * @param args - The arguments of `gh api`, with a `--jq` filter that prints one JSON value per line.
 * @returns The values printed by the filter, across every page with `--paginate`.
 * @throws {Error} When `gh` exits with an error, such as an error status from GitHub.
 */
function callGitHubApi<T>(args: string[]): T[] {
	try {
		const output = execFileSync('gh', ['api', ...args], { encoding: 'utf-8' });
		return output
			.split('\n')
			.filter(Boolean)
			.map((line) => JSON.parse(line));
	} catch (error) {
		const endpoint = args.find((arg) => arg.startsWith('repos/'));
		throw new Error(`Could not call the GitHub API: ${endpoint}`, { cause: error });
	}
}

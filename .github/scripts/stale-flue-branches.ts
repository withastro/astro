import { execSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
	options: {
		token: { type: 'string' },
	},
});

if (!values.token) {
	console.error(
		'Usage: node --experimental-strip-types stale-flue-branches.ts --token <github-token>',
	);
	process.exit(1);
}

const REPO = 'withastro/astro';
const gh = (command: string) =>
	execSync(command, { encoding: 'utf-8', env: { ...process.env, GH_TOKEN: values.token } });

// A `flue/` branch is stale when its tip commit is older than two calendar
// months at the time this runs.
const cutoff = new Date();
cutoff.setMonth(cutoff.getMonth() - 2);

interface Ref {
	// Name without the `refs/heads/flue/` prefix, e.g. `fix-16800`.
	name: string;
	target: { committedDate?: string } | null;
}

// List every `flue/` branch with its tip commit date. GraphQL returns the date
// in one paginated call; the REST branches endpoint omits it.
const query = `query($owner:String!,$name:String!,$cursor:String){
  repository(owner:$owner,name:$name){
    refs(refPrefix:"refs/heads/flue/",first:100,after:$cursor){
      nodes{ name target{ ... on Commit { committedDate } } }
      pageInfo{ hasNextPage endCursor }
    }
  }
}`;

const [owner, name] = REPO.split('/');
const branches: { branch: string; committedDate: string }[] = [];
let cursor: string | null = null;

do {
	const cursorArg = cursor ? ` -F cursor=${cursor}` : '';
	const { data } = JSON.parse(
		gh(
			`gh api graphql -f query='${query}' -F owner=${owner} -F name=${name}${cursorArg}`,
		),
	) as {
		data: {
			repository: {
				refs: { nodes: Ref[]; pageInfo: { hasNextPage: boolean; endCursor: string } };
			};
		};
	};

	const { nodes, pageInfo } = data.repository.refs;
	for (const node of nodes) {
		if (node.target?.committedDate) {
			branches.push({ branch: `flue/${node.name}`, committedDate: node.target.committedDate });
		}
	}

	cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;
} while (cursor);

// Branches with an open PR (including drafts) are kept regardless of age.
const openPrBranches = new Set<string>(
	gh(`gh pr list --repo ${REPO} --state open --json headRefName --limit 500 --jq '.[].headRefName'`)
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean),
);

const stale = branches
	.filter(({ committedDate }) => new Date(committedDate) < cutoff)
	.map(({ branch }) => branch)
	.filter((branch) => !openPrBranches.has(branch));

// biome-ignore lint/suspicious/noConsole: valid for CI
console.log(JSON.stringify(stale));

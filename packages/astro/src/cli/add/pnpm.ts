import { exec } from '../exec.js';

// Packages that integrations install (directly or transitively) whose build scripts must run.
const BUILD_DEPENDENCIES: Record<string, string[]> = {
	cloudflare: ['workerd'],
};

/** Runs `pnpm` with the given arguments and resolves with its stdout. */
export type RunPnpm = (args: string[]) => Promise<string>;

export interface PnpmBuildApproval {
	/** Flags to pass to `pnpm add`. */
	flags: string[];
	/** Persists the approvals to the pnpm config. Must run before `pnpm add`, after the user confirms. */
	approve?: () => Promise<void>;
}

/**
 * Returns how to approve the build scripts of dependencies installed by the given integrations
 * when running `pnpm add`. `getVersion` is only called when such dependencies exist.
 *
 * pnpm v11+ enables `strictDepBuilds` by default, which makes `pnpm add` exit with
 * `ERR_PNPM_IGNORED_BUILDS` when a new dependency has an unapproved build script.
 *
 * - pnpm v11.23+: pass `--allow-build=<pkg>`, which pnpm merges into the existing `allowBuilds`.
 * - pnpm v11.0–v11.22: `--allow-build` replaces the existing `allowBuilds` map rather than merging
 *   into it, so the packages are merged into the existing map via `pnpm config set` instead.
 * - Older or unknown versions: nothing. They don't fail on unapproved builds and may not support
 *   the flag (pnpm v9 rejects it as an unknown option).
 */
export async function getPnpmBuildApproval(
	integrationIds: string[],
	getVersion: () => Promise<string | undefined>,
	runPnpm: RunPnpm,
): Promise<PnpmBuildApproval> {
	const packages = [...new Set(integrationIds.flatMap((id) => BUILD_DEPENDENCIES[id] ?? []))];
	if (packages.length === 0) return { flags: [] };
	const [major, minor] = ((await getVersion()) ?? '').split('.').map((n) => Number.parseInt(n, 10));
	if (!(major >= 11)) return { flags: [] };
	if (major > 11 || minor >= 23) {
		return { flags: packages.map((name) => `--allow-build=${name}`) };
	}
	return { flags: [], approve: () => mergeAllowBuildsConfig(packages, runPnpm) };
}

/** Adds `packages` to the `allowBuilds` setting of the pnpm workspace, keeping existing entries. */
async function mergeAllowBuildsConfig(packages: string[], runPnpm: RunPnpm): Promise<void> {
	// `allowBuilds` lives in the workspace root's `pnpm-workspace.yaml`. `--workspace-root` targets
	// it from nested packages, but errors outside a workspace. In that case, pnpm creates
	// `pnpm-workspace.yaml` in the current directory.
	let scope: string[] = ['--workspace-root'];
	let current: string;
	try {
		current = await runPnpm([...scope, 'config', 'get', 'allowBuilds', '--json']);
	} catch {
		scope = [];
		current = await runPnpm(['config', 'get', 'allowBuilds', '--json']);
	}
	const merged = mergeAllowBuilds(current, packages);
	await runPnpm([
		...scope,
		'config',
		'set',
		'--location',
		'project',
		'allowBuilds',
		JSON.stringify(merged),
		'--json',
	]);
}

/** Merges `packages` as approved into the JSON output of `pnpm config get allowBuilds --json`. */
export function mergeAllowBuilds(current: string, packages: string[]): Record<string, unknown> {
	let existing: unknown;
	try {
		existing = JSON.parse(current);
	} catch {}
	const merged: Record<string, unknown> =
		existing && typeof existing === 'object' && !Array.isArray(existing) ? { ...existing } : {};
	for (const name of packages) merged[name] = true;
	return merged;
}

/** Returns the version of the `pnpm` binary run in `cwd`, or `undefined` if it can't be determined. */
export async function getPnpmVersion(cwd: string | undefined): Promise<string | undefined> {
	try {
		return (await runPnpmIn(cwd)(['--version'])).trim();
	} catch {
		return undefined;
	}
}

export function runPnpmIn(cwd: string | undefined): RunPnpm {
	return async (args) => {
		const { stdout } = await exec('pnpm', args, { nodeOptions: { cwd } });
		return stdout;
	};
}

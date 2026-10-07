import { exec } from '../exec.js';

// Packages that integrations install (directly or transitively) whose build scripts must run.
const BUILD_DEPENDENCIES: Record<string, string[]> = {
	cloudflare: ['workerd'],
};

/**
 * Returns `--allow-build` flags for `pnpm add` that approve the build scripts of dependencies
 * installed by the given integrations. `getVersion` is only called when such dependencies exist.
 *
 * pnpm v11+ enables `strictDepBuilds` by default, which makes `pnpm add` exit with
 * `ERR_PNPM_IGNORED_BUILDS` when a new dependency has an unapproved build script.
 * Returns an empty array for older or unknown pnpm versions, which don't fail on unapproved
 * builds and may not support the flag (pnpm v9 rejects it as an unknown option).
 * See https://github.com/withastro/astro/issues/18286
 */
export async function getPnpmAllowBuildFlags(
	integrationIds: string[],
	getVersion: () => Promise<string | undefined>,
): Promise<string[]> {
	const packages = new Set(integrationIds.flatMap((id) => BUILD_DEPENDENCIES[id] ?? []));
	if (packages.size === 0) return [];
	const major = Number.parseInt((await getVersion()) ?? '', 10);
	if (!(major >= 11)) return [];
	return [...packages].map((name) => `--allow-build=${name}`);
}

/** Returns the version of the `pnpm` binary run in `cwd`, or `undefined` if it can't be determined. */
export async function getPnpmVersion(cwd: string | undefined): Promise<string | undefined> {
	try {
		const { stdout } = await exec('pnpm', ['--version'], { nodeOptions: { cwd } });
		return stdout.trim();
	} catch {
		return undefined;
	}
}

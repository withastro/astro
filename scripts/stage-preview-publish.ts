/**
 * Stages a minimal workspace artifact for the preview release publish job.
 *
 * The publish job runs in a separate CI job that only has the artifact — no full
 * repo checkout. We generate synthetic root config files instead of copying the
 * real ones because the real workspace has workspace:* deps, patchedDependencies,
 * trustPolicy, etc. that all require files/packages not present in the artifact.
 *
 * Usage: node scripts/stage-preview-publish.ts <staging-dir>
 *
 * Expects AFFECTED_PACKAGES env var as a JSON array of relative package paths.
 */

import { cpSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const stagingDir: string | undefined = process.argv[2];
if (!stagingDir) {
	console.error('Usage: node scripts/stage-preview-publish.ts <staging-dir>');
	process.exit(1);
}

const affectedPackages: string[] = JSON.parse(process.env.AFFECTED_PACKAGES || '[]');
if (affectedPackages.length === 0) {
	console.error('AFFECTED_PACKAGES env var is empty or not set');
	process.exit(1);
}

mkdirSync(stagingDir, { recursive: true });

// Generate a minimal root package.json. The real one has workspace:* deps
// (e.g. astro-benchmark) that reference packages not present in the artifact.
writeFileSync(
	join(stagingDir, 'package.json'),
	JSON.stringify({ name: 'root', private: true }, null, '\t') + '\n',
);

// Generate a minimal pnpm-workspace.yaml with just the packages glob.
// The real one includes patchedDependencies, trustPolicy, onlyBuiltDependencies,
// etc. that require files/config not present in this minimal workspace.
writeFileSync(join(stagingDir, 'pnpm-workspace.yaml'), 'packages:\n  - "packages/**/*"\n');

// Copy each affected package directory, excluding directories that are never
// part of the published tarball. This keeps the artifact small enough for
// upload-artifact to handle without timing out.
const EXCLUDE_DIRS = new Set(['test', 'e2e', 'src', 'node_modules', '.turbo']);

for (const pkg of affectedPackages) {
	const dest = join(stagingDir, pkg);
	mkdirSync(dest, { recursive: true });

	for (const entry of readdirSync(pkg, { withFileTypes: true })) {
		const srcPath = join(pkg, entry.name);
		const destPath = join(dest, entry.name);
		if (entry.isDirectory() && EXCLUDE_DIRS.has(entry.name)) continue;
		cpSync(srcPath, destPath, { recursive: true });
	}
}

// Save the affected packages list for the publish job
writeFileSync(join(stagingDir, 'affected-packages.json'), JSON.stringify(affectedPackages));

console.info(`Staged ${affectedPackages.length} package(s) to ${stagingDir}`);

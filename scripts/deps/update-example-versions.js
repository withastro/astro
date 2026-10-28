// @ts-check
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'tinyglobby';

/*
  This file updates the dependencies' versions in `examples/*` to match the workspace packages' versions.
  This should be run after `changeset version` so the release PR updates all the versions together.
*/

const rootUrl = new URL('../..', import.meta.url);
const rootDir = fileURLToPath(rootUrl);

// get all workspace package name to versions
/** @type {Map<string, string>} */
const packageToVersions = new Map();

// pnpm resolves the workspace from `pnpm-workspace.yaml`, so it is the source of truth for the
// package list. Its raw globs also match test fixtures, some of which have no version, so ask pnpm
// for the packages it ends up resolving instead.
const listResult = spawnSync('pnpm', ['ls', '-r', '--depth', '-1', '--json'], {
	cwd: rootDir,
	encoding: 'utf8',
	shell: process.platform === 'win32',
});
if (listResult.error || listResult.status !== 0) {
	throw new Error(`Failed to list workspace packages: ${listResult.error ?? listResult.stderr}`);
}

for (const workspacePackage of JSON.parse(listResult.stdout)) {
	if (workspacePackage.private === true) continue;
	if (!workspacePackage.name || !workspacePackage.version) continue;

	packageToVersions.set(workspacePackage.name, workspacePackage.version);
}

// Update all examples' package.json
const exampleDirs = await glob('examples/*', {
	onlyDirectories: true,
	cwd: rootDir,
});
for (const exampleDir of exampleDirs) {
	const packageJsonPath = path.join(exampleDir, './package.json');
	const packageJson = await readAndParsePackageJson(packageJsonPath);
	if (!packageJson) continue;

	// Update dependencies
	for (const depName of Object.keys(packageJson.dependencies ?? [])) {
		if (packageToVersions.has(depName)) {
			packageJson.dependencies[depName] = `^${packageToVersions.get(depName)}`;
		}
	}

	// Update devDependencies
	for (const depName of Object.keys(packageJson.devDependencies ?? [])) {
		if (packageToVersions.has(depName)) {
			packageJson.devDependencies[depName] = `^${packageToVersions.get(depName)}`;
		}
	}

	await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

/**
 * @param {string} packageJsonPath
 * @returns {Promise<Record<string, any> | undefined>}
 */
async function readAndParsePackageJson(packageJsonPath) {
	try {
		return JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
	} catch {}
}

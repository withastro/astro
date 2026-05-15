import fs from 'node:fs';
import { dirname, join } from 'node:path';
const ROOT_FILES = [
	// '.git',
	// https://pnpm.io/workspaces/
	'pnpm-workspace.yaml',
	// https://rushjs.io/pages/advanced/config_files/
	// 'rush.json',
	// https://nx.dev/latest/react/getting-started/nx-setup
	// 'workspace.json',
	// 'nx.json',
	// https://github.com/lerna/lerna#lernajson
	'lerna.json',
];
function tryStatSync(file) {
	try {
		return fs.statSync(file, {
			throwIfNoEntry: false,
		});
	} catch {}
}
function isFileReadable(filename) {
	if (!tryStatSync(filename)) {
		return false;
	}
	try {
		fs.accessSync(filename, fs.constants.R_OK);
		return true;
	} catch {
		return false;
	}
}
function hasWorkspacePackageJSON(root) {
	const path = join(root, 'package.json');
	if (!isFileReadable(path)) {
		return false;
	}
	try {
		const content = JSON.parse(fs.readFileSync(path, 'utf-8')) || {};
		return !!content.workspaces;
	} catch {
		return false;
	}
}
function hasRootFile(root) {
	return ROOT_FILES.some((file) => fs.existsSync(join(root, file)));
}
function hasPackageJSON(root) {
	const path = join(root, 'package.json');
	return fs.existsSync(path);
}
function searchForPackageRoot(current, root = current) {
	if (hasPackageJSON(current)) return current;
	const dir = dirname(current);
	if (!dir || dir === current) return root;
	return searchForPackageRoot(dir, root);
}
function searchForWorkspaceRoot(current, root = searchForPackageRoot(current)) {
	if (hasRootFile(current)) return current;
	if (hasWorkspacePackageJSON(current)) return current;
	const dir = dirname(current);
	if (!dir || dir === current) return root;
	return searchForWorkspaceRoot(dir, root);
}
export { searchForWorkspaceRoot };

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import detectPackageManager from 'which-pm-runs';
function createAnonymousValue(payload) {
	if (payload === '') {
		return payload;
	}
	const hash = createHash('sha256');
	hash.update(payload);
	return hash.digest('hex');
}
function getProjectIdFromGit() {
	try {
		const originBuffer = execSync(`git rev-list --max-parents=0 HEAD`, {
			timeout: 500,
			stdio: ['ignore', 'pipe', 'ignore'],
		});
		return String(originBuffer).trim();
	} catch (_) {
		return null;
	}
}
function getProjectId(isCI) {
	const projectIdFromGit = getProjectIdFromGit();
	if (projectIdFromGit) {
		return {
			isGit: true,
			anonymousProjectId: createAnonymousValue(projectIdFromGit),
		};
	}
	const cwd = process.cwd();
	const isCwdGeneric = (cwd.match(/[/|\\]/g) || []).length === 1;
	if (isCI || isCwdGeneric) {
		return {
			isGit: false,
			anonymousProjectId: void 0,
		};
	}
	return {
		isGit: false,
		anonymousProjectId: createAnonymousValue(cwd),
	};
}
function getProjectInfo(isCI) {
	const projectId = getProjectId(isCI);
	const packageManager = detectPackageManager();
	return {
		...projectId,
		packageManager: packageManager?.name,
		packageManagerVersion: packageManager?.version,
	};
}
export { getProjectInfo };

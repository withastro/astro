import { execSync } from 'child_process';

// Why does Astro need a project ID? Why is it looking at my git remote?
// ---
// Astro's telemetry is and always will be completely anonymous.
// Differentiating unique projects helps us track feature usage accurately.
//
// We **never** read your actual git remote! The value is hashed one-way
// with random salt data, making it impossible for us to reverse or try to
// guess the remote by re-computing hashes.

function getProjectIdFromGit() {
	try {
		const originBuffer = execSync(`git config --local --get remote.origin.url`, {
			timeout: 1000,
			stdio: `pipe`,
		});

		return String(originBuffer).trim();
	} catch (_) {
		return null;
	}
}

export function getRawProjectId(): string {
	return getProjectIdFromGit() ?? process.env.REPOSITORY_URL ?? process.cwd();
}

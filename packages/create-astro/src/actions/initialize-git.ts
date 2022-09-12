import { execaCommand } from 'execa';

export default async function initializeGit({ cwd }: { cwd: string }) {
	return execaCommand('git init', { cwd });
}

import type { AstroConfig } from 'astro';
import { mkdir, writeFile } from 'node:fs/promises';
import { bgRed, cyan } from 'kleur/colors';
import prompts from 'prompts';
import type { Arguments } from 'yargs-parser';
import { PROJECT_ID_FILE, getSessionIdFromFile } from '../../../tokens.js';
import { getAstroStudioUrl } from '../../../utils.js';
import { MISSING_SESSION_ID_ERROR } from '../../../errors.js';

export async function cmd({ flags }: { config: AstroConfig; flags: Arguments }) {
	const linkUrl = new URL(getAstroStudioUrl() + '/auth/cli/link');
	const sessionToken = await getSessionIdFromFile();
	if (!sessionToken) {
		console.error(MISSING_SESSION_ID_ERROR);
		process.exit(1);
	}
	let body = { id: flags._[4] } as {
		id?: string;
		projectIdName?: string;
		workspaceIdName?: string;
	};
	if (!body.id) {
		const workspaceIdName = await promptWorkspaceName();
		const projectIdName = await promptProjectName();
		body = { projectIdName, workspaceIdName };
	}
	const response = await fetch(linkUrl, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${await getSessionIdFromFile()}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	});
	if (!response.ok) {
		// Unauthorized
		if (response.status === 401) {
			console.error(
				`${bgRed('Unauthorized')}\n\n  Are you logged in?\n  Run ${cyan(
					'astro db login'
				)} to authenticate and then try linking again.\n\n`
			);
			process.exit(1);
		}

		console.error(`Failed to link project: ${response.status} ${response.statusText}`);
		process.exit(1);
	}
	const { data } = await response.json();
	await mkdir(new URL('.', PROJECT_ID_FILE), { recursive: true });
	await writeFile(PROJECT_ID_FILE, `${data.id}`);
	console.info('Project linked.');
}

export async function promptProjectName(defaultName?: string): Promise<string> {
	const { projectName } = await prompts({
		type: 'text',
		name: 'projectName',
		message: 'Project ID',
		initial: defaultName,
	});
	if (typeof projectName !== 'string') {
		process.exit(0);
	}
	return projectName;
}

export async function promptWorkspaceName(defaultName?: string): Promise<string> {
	const { workspaceName } = await prompts({
		type: 'text',
		name: 'workspaceName',
		message: 'Workspace ID',
		initial: defaultName,
	});
	if (typeof workspaceName !== 'string') {
		process.exit(0);
	}
	return workspaceName;
}

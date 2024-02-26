import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getAstroStudioEnv, getAstroStudioUrl } from './utils.js';
import { MISSING_PROJECT_ID_ERROR, MISSING_SESSION_ID_ERROR } from './errors.js';

export const SESSION_LOGIN_FILE = pathToFileURL(join(homedir(), '.astro', 'session-token'));
export const PROJECT_ID_FILE = pathToFileURL(join(process.cwd(), '.astro', 'link'));

export interface ManagedAppToken {
	token: string;
	renew(): Promise<void>;
	destroy(): Promise<void>;
}

class ManagedLocalAppToken implements ManagedAppToken {
	token: string;
	constructor(token: string) {
		this.token = token;
	}
	async renew() {}
	async destroy() {}
}

class ManagedRemoteAppToken implements ManagedAppToken {
	token: string;
	session: string;
	projectId: string;
	ttl: number;
	renewTimer: NodeJS.Timeout | undefined;

	static async create(sessionToken: string, projectId: string) {
		const response = await fetch(new URL(`${getAstroStudioUrl()}/auth/cli/token-create`), {
			method: 'POST',
			headers: new Headers({
				Authorization: `Bearer ${sessionToken}`,
			}),
			body: JSON.stringify({ projectId }),
		});
		const { token: shortLivedAppToken, ttl } = await response.json();
		return new ManagedRemoteAppToken({
			token: shortLivedAppToken,
			session: sessionToken,
			projectId,
			ttl,
		});
	}

	constructor(options: { token: string; session: string; projectId: string; ttl: number }) {
		this.token = options.token;
		this.session = options.session;
		this.projectId = options.projectId;
		this.ttl = options.ttl;
		this.renewTimer = setTimeout(() => this.renew(), (1000 * 60 * 5) / 2);
	}

	private async fetch(url: string, body: unknown) {
		return fetch(`${getAstroStudioUrl()}${url}`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.session}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		});
	}

	async renew() {
		clearTimeout(this.renewTimer);
		delete this.renewTimer;
		try {
			const response = await this.fetch('/auth/cli/token-renew', {
				token: this.token,
				projectId: this.projectId,
			});
			if (response.status === 200) {
				this.renewTimer = setTimeout(() => this.renew(), (1000 * 60 * this.ttl) / 2);
			} else {
				throw new Error(`Unexpected response: ${response.status} ${response.statusText}`);
			}
		} catch (error: any) {
			const retryIn = (60 * this.ttl) / 10;
			// eslint-disable-next-line no-console
			console.error(`Failed to renew token. Retrying in ${retryIn} seconds.`, error?.message);
			this.renewTimer = setTimeout(() => this.renew(), retryIn * 1000);
		}
	}

	async destroy() {
		try {
			const response = await this.fetch('/auth/cli/token-delete', {
				token: this.token,
				projectId: this.projectId,
			});
			if (response.status !== 200) {
				throw new Error(`Unexpected response: ${response.status} ${response.statusText}`);
			}
		} catch (error: any) {
			// eslint-disable-next-line no-console
			console.error('Failed to delete token.', error?.message);
		}
	}
}

export async function getProjectIdFromFile() {
	try {
		return await readFile(PROJECT_ID_FILE, 'utf-8');
	} catch (error) {
		return undefined;
	}
}

export async function getSessionIdFromFile() {
	try {
		return await readFile(SESSION_LOGIN_FILE, 'utf-8');
	} catch (error) {
		return undefined;
	}
}

export async function getManagedAppTokenOrExit(token?: string): Promise<ManagedAppToken> {
	if (token) {
		return new ManagedLocalAppToken(token);
	}
	const { ASTRO_STUDIO_APP_TOKEN } = getAstroStudioEnv();
	if (ASTRO_STUDIO_APP_TOKEN) {
		return new ManagedLocalAppToken(ASTRO_STUDIO_APP_TOKEN);
	}
	const sessionToken = await getSessionIdFromFile();
	if (!sessionToken) {
		// eslint-disable-next-line no-console
		console.error(MISSING_SESSION_ID_ERROR);
		process.exit(1);
	}
	const projectId = await getProjectIdFromFile();
	if (!sessionToken || !projectId) {
		// eslint-disable-next-line no-console
		console.error(MISSING_PROJECT_ID_ERROR);
		process.exit(1);
	}
	return ManagedRemoteAppToken.create(sessionToken, projectId);
}

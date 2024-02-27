import type { AstroConfig } from 'astro';
import { cyan } from 'kleur/colors';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import ora from 'ora';
import type { Arguments } from 'yargs-parser';
import { getAstroStudioUrl } from '../../../utils.js';
import open from 'open';
import { SESSION_LOGIN_FILE } from '../../../tokens.js';

function serveAndResolveSession(): Promise<string> {
	let resolve: (value: string | PromiseLike<string>) => void,
		reject: (value?: string | PromiseLike<string>) => void;
	const sessionPromise = new Promise<string>((_resolve, _reject) => {
		resolve = _resolve;
		reject = _reject;
	});

	const server = createServer((req, res) => {
		res.writeHead(200);
		res.end();
		const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
		const session = url.searchParams.get('session');
		if (!session) {
			reject();
		} else {
			resolve(session);
		}
	}).listen(5710, 'localhost');

	return sessionPromise.finally(() => {
		server.closeAllConnections();
		server.close();
	});
}

export async function cmd({ flags }: { config: AstroConfig; flags: Arguments }) {
	let session = flags.session;
	const loginUrl = getAstroStudioUrl() + '/auth/cli';

	if (!session) {
		console.log(`Opening ${cyan(loginUrl)} in your browser...`);
		console.log(`If something goes wrong, copy-and-paste the URL into your browser.`);
		open(loginUrl);
		const spinner = ora('Waiting for confirmation...');
		session = await serveAndResolveSession();
		spinner.succeed('Successfully logged in!');
	}

	await mkdir(new URL('.', SESSION_LOGIN_FILE), { recursive: true });
	await writeFile(SESSION_LOGIN_FILE, `${session}`);
}

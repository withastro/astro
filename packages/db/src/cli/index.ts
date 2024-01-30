import type { AstroConfig } from 'astro';
import type { Arguments } from 'yargs-parser';
import { createClient, type InStatement } from '@libsql/client';
import { getAstroStudioEnv, getRemoteDatabaseUrl } from '../utils.js';

export async function cli({ flags, config }: { flags: Arguments; config: AstroConfig }) {
	const command = flags._[3] as string;

	switch (command) {
		case 'shell': {
			const { cmd: shellCommand } = await import('./commands/shell/index.js');
			return await shellCommand({ config, flags });
		}
		case 'sync': {
			const { cmd: syncCommand } = await import('./commands/sync/index.js');
			return await syncCommand({ config, flags });
		}
		case 'push': {
			const { cmd: pushCommand } = await import('./commands/push/index.js');
			return await pushCommand({ config, flags });
		}
		case 'verify': {
			const { cmd: verifyCommand } = await import('./commands/verify/index.js');
			return await verifyCommand({ config, flags });
		}
		case 'batch-test': {
			const queries: InStatement[] = [
				{
					sql: 'PRAGMA foreign_keys=OFF;',
					args: [],
				},
				// {
				// 	sql: 'DROP TABLE IF EXISTS user;',
				// 	args: [],
				// },
				// {
				// 	sql: 'DROP TABLE IF EXISTS account;',
				// 	args: [],
				// },
				// 				{
				// 					sql: `CREATE TABLE user (
				// 	id INTEGER PRIMARY KEY,
				// 	name TEXT NOT NULL
				// );`,
				// 					args: [],
				// 				},
				// 				{
				// 					sql: `CREATE TABLE account (
				// 	id INTEGER PRIMARY KEY,
				// 	user_id INTEGER NOT NULL,
				// 	FOREIGN KEY (user_id) REFERENCES user (id)
				// );`,
				// 					args: [],
				// 				},
				// 				{
				// 					sql: `INSERT INTO user (id, name) VALUES (?, ?);`,
				// 					args: [1, 'Alice'],
				// 				},
				{
					sql: `INSERT INTO account (id, user_id) VALUES (?, ?);`,
					args: [2, 5],
				},
			];

			const url = new URL('/db/query', getRemoteDatabaseUrl());
			const appToken = getAstroStudioEnv().ASTRO_STUDIO_APP_TOKEN;

			const res = await fetch(url, {
				method: 'POST',
				headers: new Headers({
					Authorization: `Bearer ${appToken}`,
				}),
				body: JSON.stringify(queries),
			});

			console.log(res, res.status === 200 ? await res.json() : await res.text());
			return;
		}
		default: {
			if (command == null) {
				// eslint-disable-next-line no-console
				console.error(`No command provided.

${showHelp()}`);
			} else {
				// eslint-disable-next-line no-console
				console.error(`Unknown command: ${command}

${showHelp()}`);
			}
			return;
		}
	}

	function showHelp() {
		return `astro db <command>
		
Usage:

astro db sync        Creates snapshot based on your schema
astro db push        Pushes migrations to Astro Studio
astro db verify      Verifies migrations have been pushed and errors if not`;
	}
}

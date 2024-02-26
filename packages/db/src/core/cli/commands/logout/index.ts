import type { AstroConfig } from 'astro';
import { unlink } from 'node:fs/promises';
import type { Arguments } from 'yargs-parser';
import { SESSION_LOGIN_FILE } from '../../../tokens.js';

export async function cmd({}: { config: AstroConfig; flags: Arguments }) {
	await unlink(SESSION_LOGIN_FILE);
	console.log('Successfully logged out of Astro Studio.');
}

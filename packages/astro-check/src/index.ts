/* eslint-disable no-console */

import type { AstroConfig } from 'astro';

import * as colors from 'kleur/colors';
import yargs from 'yargs-parser';
import { z } from 'zod';
import { check } from './check.js';
import { formatConfigError, loadConfig } from 'astro/core/config';


/** The primary CLI action */
export async function cli(args: string[]) {
	const flags = yargs(args);
	const projectRoot = flags.projectRoot || flags._[3];

	let config: AstroConfig;
	try {
		config = await loadConfig({ cwd: projectRoot, flags });
	} catch (err) {
		throwAndExit(err);
		return;
	}

	const ret = await check(config);
	return process.exit(ret);
}

/** Display error and exit */
function throwAndExit(err: any) {
	if (err instanceof z.ZodError) {
		console.error(formatConfigError(err));
	} else if (err.stack) {
		const [mainMsg, ...stackMsg] = err.stack.split('\n');
		console.error(colors.red(mainMsg) + '\n' + colors.dim(stackMsg.join('\n')));
	} else {
		console.error(colors.red(err.toString() || err));
	}
	process.exit(1);
}

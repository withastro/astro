/* eslint no-console: 'off' */
import type { Context } from "./context";

import { color, generateProjectName } from '@astrojs/cli-kit';
import { title, info } from '../messages.js';
import path from 'node:path';

import { isEmpty, toValidName } from './shared.js';

export async function projectName(ctx: Pick<Context, 'cwd'|'prompt'|'projectName'>) {
	await checkCwd(ctx.cwd);

	if (!ctx.cwd || !isEmpty(ctx.cwd)) {
		if (!isEmpty(ctx.cwd)) {
			await info('Hmm...', `${color.reset(`"${ctx.cwd}"`)}${color.dim(` is not empty!`)}`);
		}

		const { name } = await ctx.prompt({
			name: 'name',
			type: 'text',
			label: title('dir'),
			message: 'Where should we create your new project?',
			initial: `./${generateProjectName()}`,
			validate(value: string) {
				if (!isEmpty(value)) {
					return `Directory is not empty!`;
				}
				return true;
			},
		});
		ctx.cwd = name!;
		ctx.projectName = toValidName(name!);
	} else {
		let name = ctx.cwd;
		if (name === '.' || name === './') {
			const parts = process.cwd().split(path.sep);
			name = parts[parts.length - 1];
		} else if (name.startsWith('./') || name.startsWith('../')) {
			const parts = name.split('/');
			name = parts[parts.length - 1];
		}
		ctx.projectName = toValidName(name);
	}

	if (!ctx.cwd) {
		process.exit(1);
	}
}

async function checkCwd(cwd: string | undefined) {
	const empty = cwd && isEmpty(cwd);
	if (empty) {
		console.log('');
		await info('dir', `Using ${color.reset(cwd)}${color.dim(' as project directory')}`);
	}

	return empty;
}

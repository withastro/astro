import path from 'node:path';
import { color, generateProjectName } from '@astrojs/cli-kit';
import { info, log, title } from '../messages.js';
import type { Context } from './context.js';

import { isEmpty, toValidName } from './shared.js';

export async function projectName(
	ctx: Pick<Context, 'yes' | 'dryRun' | 'prompt' | 'projectName' | 'exit'> & { cwd?: string },
) {
	await checkCwd(ctx.cwd);

	if (!ctx.cwd || !isEmpty(ctx.cwd)) {
		if (ctx.cwd && !isEmpty(ctx.cwd)) {
			await info('Hmm...', `${color.reset(`"${ctx.cwd}"`)}${color.dim(` is not empty!`)}`);
		}

		if (ctx.yes) {
			ctx.projectName = generateProjectName();
			ctx.cwd = `./${ctx.projectName}`;
			await info('dir', `Project created at ./${ctx.projectName}`);
			return;
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
				// Check for non-printable characters
				if (value.match(/[^\x20-\x7E]/g) !== null)
					return `Invalid non-printable character present!`;
				return true;
			},
		});

		ctx.cwd = name!.trim();
		if (ctx.dryRun) {
			ctx.projectName = toValidName(name!);
			await info('--dry-run', 'Skipping project naming');
			return;
		}
	}

	if (ctx.cwd.startsWith('@') && ctx.cwd.includes('/')) {
		ctx.projectName = toValidName(ctx.cwd);
	} else {
		ctx.projectName = toValidName(path.basename(path.resolve(ctx.cwd)));
	}

	if (!ctx.cwd) {
		ctx.exit(1);
	}
}

async function checkCwd(cwd: string | undefined) {
	const empty = cwd && isEmpty(cwd);
	if (empty) {
		log('');
		await info('dir', `Using ${color.reset(cwd)}${color.dim(' as project directory')}`);
	}

	return empty;
}

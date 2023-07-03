import type { Context } from './context';

import { color } from '@astrojs/cli-kit';
import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import stripJsonComments from 'strip-json-comments';
import { error, info, spinner, title, typescriptByDefault } from '../messages.js';

export async function typescript(
	ctx: Pick<Context, 'typescript' | 'yes' | 'prompt' | 'dryRun' | 'cwd' | 'exit'>
) {
	let ts = ctx.typescript ?? (typeof ctx.yes !== 'undefined' ? 'strict' : undefined);
	if (ts === undefined) {
		const { useTs } = await ctx.prompt({
			name: 'useTs',
			type: 'confirm',
			label: title('ts'),
			message: `Do you plan to write TypeScript?`,
			initial: true,
		});
		if (!useTs) {
			await typescriptByDefault();
			return;
		}

		({ ts } = await ctx.prompt({
			name: 'ts',
			type: 'select',
			label: title('use'),
			message: `How strict should TypeScript be?`,
			initial: 'strict',
			choices: [
				{ value: 'strict', label: 'Strict', hint: `(recommended)` },
				{ value: 'strictest', label: 'Strictest' },
				{ value: 'base', label: 'Relaxed' },
			],
		}));
	} else {
		if (!['strict', 'strictest', 'relaxed', 'default', 'base'].includes(ts)) {
			if (!ctx.dryRun) {
				fs.rmSync(ctx.cwd, { recursive: true, force: true });
			}
			error(
				'Error',
				`Unknown TypeScript option ${color.reset(ts)}${color.dim(
					'! Expected strict | strictest | relaxed'
				)}`
			);
			ctx.exit(1);
		}
		await info('ts', `Using ${color.reset(ts)}${color.dim(' TypeScript configuration')}`);
	}

	if (ctx.dryRun) {
		await info('--dry-run', `Skipping TypeScript setup`);
	} else if (ts && ts !== 'unsure') {
		if (ts === 'relaxed' || ts === 'default') {
			ts = 'base';
		}
		await spinner({
			start: 'TypeScript customizing...',
			end: 'TypeScript customized',
			while: () =>
				setupTypeScript(ts!, { cwd: ctx.cwd }).catch((e) => {
					error('error', e);
					process.exit(1);
				}),
		});
	} else {
	}
}

export async function setupTypeScript(value: string, { cwd }: { cwd: string }) {
	const templateTSConfigPath = path.join(cwd, 'tsconfig.json');
	try {
		const data = await readFile(templateTSConfigPath, { encoding: 'utf-8' });
		const templateTSConfig = JSON.parse(stripJsonComments(data));
		if (templateTSConfig && typeof templateTSConfig === 'object') {
			const result = Object.assign(templateTSConfig, {
				extends: `astro/tsconfigs/${value}`,
			});

			fs.writeFileSync(templateTSConfigPath, JSON.stringify(result, null, 2));
		} else {
			throw new Error(
				"There was an error applying the requested TypeScript settings. This could be because the template's tsconfig.json is malformed"
			);
		}
	} catch (err) {
		if (err && (err as any).code === 'ENOENT') {
			// If the template doesn't have a tsconfig.json, let's add one instead
			fs.writeFileSync(
				templateTSConfigPath,
				JSON.stringify({ extends: `astro/tsconfigs/${value}` }, null, 2)
			);
		}
	}
}

import type { Context } from "./context";

import fs from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path';
import { assign, parse, stringify } from 'comment-json';
import { spinner, color } from '@astrojs/cli-kit';
import { title, info, error, typescriptByDefault } from '../messages.js';

export async function typescript(ctx: Pick<Context, 'typescript'|'yes'|'prompt'|'dryRun'|'cwd'>) {
	let ts = ctx.typescript ?? (ctx.yes ? 'strict' : ctx.yes);
	if (!ts) {
		({ ts } = await ctx.prompt({
			name: 'ts',
			type: 'select',
			label: title('ts'),
			message: `Customize TypeScript?`,
			initial: 'strict',
			choices: [
				{ value: 'strict', label: 'Strict', hint: `(recommended)` },
				{ value: 'strictest', label: 'Strictest' },
				{ value: 'default', label: 'Relaxed' },
				{ value: 'unsure', label: `I prefer JavaScript` },
			],
		}));
	} else {
		if (!['strict', 'strictest', 'relaxed', 'default'].includes(ts)) {
			if (!ctx.dryRun) {
				fs.rmSync(ctx.cwd, { recursive: true, force: true });
			}
			error(
				'Error',
				`Unknown TypeScript option ${color.reset(ts)}${color.dim(
					'! Expected strict | strictest | relaxed'
				)}`
			);
			process.exit(1);
		}
		await info('ts', `Using ${color.reset(ts)}${color.dim(' TypeScript configuration')}`);
	}

	if (ctx.dryRun) {
		await info('--dry-run', `Skipping TypeScript setup`);
	} else if (ts && ts !== 'unsure') {
		if (ts === 'relaxed') {
			ts = 'default';
		}
		await spinner({
			start: 'TypeScript customizing...',
			end: 'TypeScript customized',
			while: () => setupTypeScript(ts as string, { cwd: ctx.cwd }),
		});
	} else {
		await typescriptByDefault();
	}
}

export async function setupTypeScript(value: string, { cwd }: { cwd: string }) {
	const templateTSConfigPath = path.join(cwd, 'tsconfig.json');
	try {
		const data = await readFile(templateTSConfigPath, { encoding: 'utf-8' })
		const templateTSConfig = parse(data);
		if (templateTSConfig && typeof templateTSConfig === 'object') {
			const result = assign(templateTSConfig, {
				extends: `astro/tsconfigs/${value}`,
			});

			fs.writeFileSync(templateTSConfigPath, stringify(result, null, 2));
		} else {
			throw new Error("There was an error applying the requested TypeScript settings. This could be because the template's tsconfig.json is malformed")
		}
	} catch (err) {
		if (err && (err as any).code === 'ENOENT') {
			// If the template doesn't have a tsconfig.json, let's add one instead
			fs.writeFileSync(
				templateTSConfigPath,
				stringify({ extends: `astro/tsconfigs/${value}` }, null, 2)
			);
		}
	}
}

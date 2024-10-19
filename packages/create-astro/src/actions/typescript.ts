import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { color } from '@astrojs/cli-kit';
import stripJsonComments from 'strip-json-comments';
import { error, getVersion, info, title, typescriptByDefault } from '../messages.js';
import type { Context } from './context.js';

type PickedTypeScriptContext = Pick<
	Context,
	| 'typescript'
	| 'yes'
	| 'prompt'
	| 'dryRun'
	| 'cwd'
	| 'exit'
	| 'packageManager'
	| 'install'
	| 'tasks'
>;

export async function typescript(ctx: PickedTypeScriptContext) {
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
				await rm(ctx.cwd, { recursive: true, force: true });
			}
			error(
				'Error',
				`Unknown TypeScript option ${color.reset(ts)}${color.dim(
					'! Expected strict | strictest | relaxed',
				)}`,
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
		ctx.tasks.push({
			pending: 'TypeScript',
			start: 'TypeScript customizing...',
			end: 'TypeScript customized',
			while: () =>
				setupTypeScript(ts!, ctx).catch((e) => {
					error('error', e);
					process.exit(1);
				}),
		});
	} else {
	}
}

const FILES_TO_UPDATE = {
	'package.json': async (
		file: string,
		options: { value: string; ctx: PickedTypeScriptContext },
	) => {
		try {
			// inject additional command to build script
			const data = await readFile(file, { encoding: 'utf-8' });
			const indent = /(^\s+)/m.exec(data)?.[1] ?? '\t';
			const parsedPackageJson = JSON.parse(data);

			const buildScript = parsedPackageJson.scripts?.build;

			// in case of any other template already have astro checks defined, we don't want to override it
			if (typeof buildScript === 'string' && !buildScript.includes('astro check')) {
				// Mutate the existing object to avoid changing user-defined script order
				parsedPackageJson.scripts.build = `astro check && ${buildScript}`;
			}

			const [astroCheckVersion, typescriptVersion] = await Promise.all([
				getVersion(options.ctx.packageManager, '@astrojs/check', process.env.ASTRO_CHECK_VERSION),
				getVersion(options.ctx.packageManager, 'typescript', process.env.TYPESCRIPT_VERSION),
			]);
			parsedPackageJson.dependencies ??= {};
			parsedPackageJson.dependencies['@astrojs/check'] = `^${astroCheckVersion}`;
			parsedPackageJson.dependencies.typescript = `^${typescriptVersion}`;

			await writeFile(file, JSON.stringify(parsedPackageJson, null, indent) + '\n', 'utf-8');
		} catch (err) {
			// if there's no package.json (which is very unlikely), then do nothing
			if (err && (err as any).code === 'ENOENT') return;
			if (err instanceof Error) throw new Error(err.message);
		}
	},
	'tsconfig.json': async (file: string, options: { value: string }) => {
		try {
			const data = await readFile(file, { encoding: 'utf-8' });
			const templateTSConfig = JSON.parse(stripJsonComments(data));
			if (templateTSConfig && typeof templateTSConfig === 'object') {
				const result = Object.assign(templateTSConfig, {
					extends: `astro/tsconfigs/${options.value}`,
				});

				await writeFile(file, JSON.stringify(result, null, 2) + '\n');
			} else {
				throw new Error(
					"There was an error applying the requested TypeScript settings. This could be because the template's tsconfig.json is malformed",
				);
			}
		} catch (err) {
			if (err && (err as any).code === 'ENOENT') {
				// If the template doesn't have a tsconfig.json, let's add one instead
				await writeFile(
					file,
					JSON.stringify({ extends: `astro/tsconfigs/${options.value}` }, null, 2) + '\n',
				);
			}
		}
	},
	'astro.config.mjs': async (file: string, options: { value: string }) => {
		if (!(options.value === 'strict' || options.value === 'strictest')) {
			return;
		}

		try {
			let data = await readFile(file, { encoding: 'utf-8' });
			data = `// @ts-check\n${data}`;
			await writeFile(file, data, { encoding: 'utf-8' });
		} catch (err) {
			// if there's no astro.config.mjs (which is very unlikely), then do nothing
			if (err && (err as any).code === 'ENOENT') return;
			if (err instanceof Error) throw new Error(err.message);
		}
	},
};

export async function setupTypeScript(value: string, ctx: PickedTypeScriptContext) {
	await Promise.all(
		Object.entries(FILES_TO_UPDATE).map(async ([file, update]) =>
			update(path.resolve(path.join(ctx.cwd, file)), { value, ctx }),
		),
	);
}

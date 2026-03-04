#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

// The language tools test run in node 20.x where type stripping is not available.
// Since the setup file is in TS (needed because it imports from TS test utils),
// we run the whole script with TSX if tsx is used
if (process.argv.includes('--tsx') && !process.execArgv.includes('--import=tsx')) {
	const result = spawnSync(
		process.execPath,
		['--import=tsx', ...process.execArgv, ...process.argv.slice(1)],
		{
			stdio: 'inherit',
		},
	);
	process.exit(result.status ?? 1);
}

export default async function run() {
	const [cmd, ...args] = process.argv.slice(2);
	switch (cmd) {
		case 'dev':
		case 'build': {
			const { default: build } = await import('./cmd/build.js');
			await build(...args, cmd === 'dev' ? 'IS_DEV' : undefined);
			break;
		}
		case 'prebuild': {
			const { default: prebuild } = await import('./cmd/prebuild.js');
			await prebuild(...args);
			break;
		}
		case 'test': {
			const { default: test } = await import('./cmd/test.js');
			await test(...args);
			break;
		}
	}
}

run();

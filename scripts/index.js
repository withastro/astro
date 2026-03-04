#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import * as semver from 'semver';

// Re-exec with --experimental-strip-types on Node < 22.18 (where it's not enabled by default)
if (
	!semver.satisfies(process.versions.node, '>=22.20.0') &&
	!process.execArgv.includes('--experimental-strip-types')
) {
	const result = spawnSync(
		process.execPath,
		['--experimental-strip-types', ...process.execArgv, process.argv[1], ...process.argv.slice(2)],
		{ stdio: 'inherit' },
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

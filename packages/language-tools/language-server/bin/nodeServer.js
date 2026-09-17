#!/usr/bin/env node
import { createRequire } from 'node:module';

if (process.argv.includes('--version')) {
	const { version } = createRequire(import.meta.url)('../package.json');
	console.info(`${version}`);
} else {
	import('../dist/nodeServer.js').catch((error) => {
		console.error(error);
		process.exitCode = 1;
	});
}

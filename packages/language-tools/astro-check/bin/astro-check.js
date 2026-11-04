#!/usr/bin/env node

import path from 'node:path';
import { check, parseArgsAsCheckConfig } from '../dist/index.js';

let args;
try {
	args = parseArgsAsCheckConfig(process.argv);
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
}

if (!args.help && !args.version) {
	console.info(`Getting diagnostics for Astro files in ${path.resolve(args.root)}...`);
}

const result = await check(args);

if (typeof result === 'boolean') {
	process.exit(result ? 1 : 0);
}

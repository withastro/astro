#!/usr/bin/env node

import path from 'node:path';
import { check, parseArgsAsCheckConfig, printHelp, printVersion } from '../dist/index.js';

const args = parseArgsAsCheckConfig(process.argv);

if (args.help) {
	printHelp();
	process.exit(0);
}

if (args.version) {
	printVersion();
	process.exit(0);
}

console.info(`Getting diagnostics for Astro files in ${path.resolve(args.root)}...`);

const result = await check(args);

if (typeof result === 'boolean') {
	process.exit(result ? 1 : 0);
}

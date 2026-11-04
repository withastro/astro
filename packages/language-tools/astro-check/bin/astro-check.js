#!/usr/bin/env node

import path from 'node:path';
import { check, parseArgsAsCheckConfig } from '../dist/index.js';
import { options } from '../dist/options.js';

const args = parseArgsAsCheckConfig(process.argv);

if (args.help) {
	const optionsHelp = Object.entries(options).map(
		([name, option]) => `  --${name}  ${option.description ?? ''}`,
	);
	console.info(
		['astro-check [options]', '', 'Options:', ...optionsHelp, '  -h, --help  Show help'].join('\n'),
	);
	process.exit(0);
}

console.info(`Getting diagnostics for Astro files in ${path.resolve(args.root)}...`);

const result = await check(args);

if (typeof result === 'boolean') {
	process.exit(result ? 1 : 0);
}

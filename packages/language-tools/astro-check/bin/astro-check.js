#!/usr/bin/env node

import path from 'node:path';
import { check, parseArgsAsCheckConfig } from '../dist/index.js';

const args = parseArgsAsCheckConfig(process.argv.slice(2));

console.warn(
	'`astro-check` is deprecated and will be removed in a future major release. Migrate to TypeScript 7.1 or later and `@astrojs/ts-content-mapper`. See https://github.com/withastro/astro/tree/main/packages/language-tools/ts-content-mapper#usage',
);
console.info(`Getting diagnostics for Astro files in ${path.resolve(args.root)}...`);

const result = await check(args);

if (typeof result === 'boolean') {
	process.exit(result ? 1 : 0);
}

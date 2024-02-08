// @ts-check

import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import pLimit from 'p-limit';
import { parse, TSConfckParseError } from 'tsconfck'

async function checkExamples() {
	let examples = readdirSync('./examples', { withFileTypes: true });
	examples = examples.filter((dirent) => dirent.isDirectory());

	console.log(`Running astro check on ${examples.length} examples...`);

	// Run astro check in parallel with 5 at most
	const checkPromises = [];
	const limit = pLimit(5);

	for (const example of examples) {
		// Ensure codegen has run to generate tsconfigs and prevent tsconfck from failing
		await new Promise((resolve) => {
			console.log(`Running \`astro sync\` for ${example.name}...`)
			spawn('node', ['../../packages/astro/astro.js', 'sync'], {
				cwd: path.join('./examples', example.name),
				env: { ...process.env, FORCE_COLOR: 'true' },
			}).on('close', () => resolve(undefined))
		})
	}

	for (const example of examples) {
		checkPromises.push(
			limit(
				() =>
					new Promise(async (resolve) => {
						// Sometimes some examples may get deleted, but after a `git pull` the directory still exists.
						// This can stall the process time as it'll typecheck the entire monorepo, so do a quick exist
						// check here before typechecking this directory.
						if (!existsSync(path.join('./examples/', example.name, 'package.json'))) {
							resolve(0);
							return;
						}

						const originalConfig = await prepareExample(example.name);
						let data = '';
						const child = spawn('node', ['../../packages/astro/astro.js', 'check'], {
							cwd: path.join('./examples', example.name),
							env: { ...process.env, FORCE_COLOR: 'true' },
						});

						child.stdout.on('data', function (buffer) {
							data += buffer.toString();
						});

						child.on('exit', (code) => {
							if (code !== 0) {
								console.error(data);
							}
							if (originalConfig) {
								resetExample(example.name, originalConfig);
							}
							resolve(code);
						});
					})
			)
		);
	}

	Promise.all(checkPromises).then((codes) => {
		if (codes.some((code) => code !== 0)) {
			process.exit(1);
		}

		console.log('No errors found!');
	});
}

/**
 * 
 * @param {string} tsconfigPath 
 * @param {import('tsconfck').TSConfckParseOptions} options 
 * @returns {Promise<import('tsconfck').TSConfckParseResult | 'invalid-config' | 'missing-config' | 'unknown-error'>}
 */
async function safeParse(tsconfigPath, options = {}) {
	try {
		const parseResult = await parse(tsconfigPath, options);

		if (parseResult.tsconfig == null) {
			return 'missing-config';
		}

		return parseResult;
	} catch (e) {
		// TODO: remove
		console.error(e)
		if (e instanceof TSConfckParseError) {
			return 'invalid-config';
		}

		return 'unknown-error';
	}
}

/**
 * @param {string} examplePath
 */
async function prepareExample(examplePath) {
	const tsconfigPath = path.join('./examples/', examplePath, 'tsconfig.json');
	const tsconfig = await safeParse(tsconfigPath)
	let originalConfig = undefined;

	if (tsconfig === 'missing-config') {
		return originalConfig
	}

	if (typeof tsconfig === 'string') {
		throw new Error(`Couldn't load tsconfig at "${tsconfigPath}". Reason: "${tsconfig}"`)
	}

	const rawTsConfig = (tsconfig.extended ?? [])[0]
	/** @type {Array<string>} */
	const extendsFields = rawTsConfig.tsconfig.extends
	extendsFields.map(e =>
		e.replace('astro/tsconfig/base', 'astro/tsconfigs/strictest')
		.replace('astro/tsconfigs/strict', 'astro/tsconfigs/strictest')
	)

	originalConfig = readFileSync(tsconfigPath).toString();
	
		if (!rawTsConfig.tsconfig.compilerOptions) {
			rawTsConfig.tsconfig.compilerOptions = {};
		}
	rawTsConfig.tsconfig.compilerOptions = Object.assign(rawTsConfig.tsconfig.compilerOptions, {
			types: rawTsConfig.tsconfig.compilerOptions.types ?? [], // Speeds up tests
	});
	writeFileSync(tsconfigPath, JSON.stringify(rawTsConfig.tsconfig));

	return originalConfig;
}

/**
 * @param {string} examplePath
 * @param {string} originalConfig
 */
function resetExample(examplePath, originalConfig) {
	const tsconfigPath = path.join('./examples/', examplePath, 'tsconfig.json');
	writeFileSync(tsconfigPath, originalConfig);
}

checkExamples();

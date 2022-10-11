// @ts-check

import { spawn } from 'child_process';
import { readdirSync, writeFileSync } from 'fs';
import * as path from 'path';
import { tsconfigResolverSync } from 'tsconfig-resolver';

function checkExamples() {
	let examples = readdirSync('./examples', { withFileTypes: true });
	examples = examples.filter((dirent) => dirent.isDirectory());

	console.log(`Running astro check on ${examples.length} examples...`);

	Promise.all(
		examples.map(
			(example) =>
				new Promise((resolve) => {
					prepareExample(example.name);
					let data = '';
					const child = spawn('node', ['../../packages/astro/astro.js', 'check'], {
						cwd: path.join('./examples', example.name),
						env: { ...process.env, FORCE_COLOR: true }
					});

					child.stdout.on('data', function (buffer) {
						data += buffer.toString();
					});

					child.on('exit', (code) => {
						if (code !== 0) {
							console.error(data);
						}
						resolve(code);
					});
				})
		)
	).then((codes) => {
		if (codes.some((code) => code !== 0)) {
			process.exit(1);
		}
	});
}

/**
 * @param {string} examplePath
 */
function prepareExample(examplePath) {
	const tsconfigPath = path.join('./examples/', examplePath, 'tsconfig.json');
	const tsconfig = tsconfigResolverSync({ filePath: tsconfigPath, cache: false });

	if (tsconfig.exists) {
		tsconfig.config.extends = 'astro/tsconfigs/strictest';

		if (!tsconfig.config.compilerOptions) {
			tsconfig.config.compilerOptions = {};
		}

		tsconfig.config.compilerOptions = Object.assign(tsconfig.config.compilerOptions, {
			types: tsconfig.config.compilerOptions.types ?? [], // Speeds up tests
		});
	}

	writeFileSync(tsconfigPath, JSON.stringify(tsconfig.config, null, 2));
}

checkExamples();

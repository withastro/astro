/* eslint-disable no-console */
import { AstroCheck, DiagnosticSeverity } from '@astrojs/language-server';
import type { AstroConfig } from '../../@types/astro';

import glob from 'fast-glob';
import * as fs from 'fs';
import { bold, dim, red, yellow } from 'kleur/colors';
import ora from 'ora';
import { fileURLToPath, pathToFileURL } from 'url';
import { printDiagnostic } from './print.js';

interface Result {
	errors: number;
	// The language server cannot actually return any warnings at the moment, but we'll keep this here for future use
	warnings: number;
	hints: number;
}

export async function check(astroConfig: AstroConfig) {
	console.log(bold('astro check'));

	const root = astroConfig.root;

	const spinner = ora(` Getting diagnostics for Astro files in ${fileURLToPath(root)}…`).start();

	let checker = new AstroCheck(root.toString());
	const filesCount = await openAllDocuments(root, [], checker);

	let diagnostics = await checker.getDiagnostics();

	spinner.succeed();

	let result: Result = {
		errors: 0,
		warnings: 0,
		hints: 0,
	};

	diagnostics.forEach((diag) => {
		diag.diagnostics.forEach((d) => {
			console.log(printDiagnostic(diag.filePath, diag.text, d));

			switch (d.severity) {
				case DiagnosticSeverity.Error: {
					result.errors++;
					break;
				}
				case DiagnosticSeverity.Warning: {
					result.warnings++;
					break;
				}
				case DiagnosticSeverity.Hint: {
					result.hints++;
					break;
				}
			}
		});
	});

	console.log(
		[
			bold(`Result (${filesCount} file${filesCount === 1 ? '' : 's'}): `),
			bold(red(`${result.errors} ${result.errors === 1 ? 'error' : 'errors'}`)),
			bold(yellow(`${result.warnings} ${result.warnings === 1 ? 'warning' : 'warnings'}`)),
			dim(`${result.hints} ${result.hints === 1 ? 'hint' : 'hints'}\n`),
		].join(`\n${dim('-')} `)
	);

	const exitCode = result.errors ? 1 : 0;
	return exitCode;
}

/**
 * Open all Astro files in the given directory and return the number of files found.
 */
async function openAllDocuments(
	workspaceUri: URL,
	filePathsToIgnore: string[],
	checker: AstroCheck
): Promise<number> {
	const files = await glob('**/*.astro', {
		cwd: fileURLToPath(workspaceUri),
		ignore: ['node_modules/**'].concat(filePathsToIgnore.map((ignore) => `${ignore}/**`)),
		absolute: true,
	});

	for (const file of files) {
		const text = fs.readFileSync(file, 'utf-8');
		checker.upsertDocument({
			uri: pathToFileURL(file).toString(),
			text,
		});
	}

	return files.length;
}

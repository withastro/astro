/* eslint no-console: 'off' */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import type { Arguments as Flags } from "yargs-parser";
import { color, prompt } from "@astrojs/cli-kit";
import degit from 'degit';

import { isEmpty } from "./shared.js";
import { info } from '../messages.js';

// some files are only needed for online editors when using astro.new. Remove for create-astro installs.
const FILES_TO_REMOVE = ['.stackblitzrc', 'sandbox.config.json', 'CHANGELOG.md'];


export default async function copyTemplate(template: string, { flags, cwd }: { flags: Flags, cwd: string }) {
	const hash = flags.commit ? `#${flags.commit}` : '';
	const isThirdParty = template.includes('/');

	const templateTarget = isThirdParty
		? template
		: `withastro/astro/examples/${template}#latest`;

	const emitter = degit(`${templateTarget}${hash}`, {
		cache: false,
		force: true,
		verbose: false,
	});

	// logger.debug('Initialized degit with following config:', `${templateTarget}${hash}`, {
	// 	cache: false,
	// 	force: true,
	// 	verbose: defaultLogLevel === 'debug' ? true : false,
	// });

	// Copy
	if (!flags.dryRun) {
		try {
			// emitter.on('info', (info) => {
			// 	logger.debug(info.message);
			// });
			await emitter.clone(cwd);

			// degit does not return an error when an invalid template is provided, as such we need to handle this manually
			// It's not very pretty, but to the user eye, we just return a nice message and nothing weird happened
			if (isEmpty(cwd)) {
				fs.rmdirSync(cwd);
				throw new Error(`Error: The provided template (${color.cyan(template)}) does not exist`);
			}
		} catch (err: any) {
			// templateSpinner.fail();

			// degit is compiled, so the stacktrace is pretty noisy. Only report the stacktrace when using verbose mode.
			if (flags.verbose) {
				console.debug(err);
				console.error(err.message);
			}

			// Warning for issue #655 and other corrupted cache issue
			if (
				err.message === 'zlib: unexpected end of file' ||
				err.message === 'TAR_BAD_ARCHIVE: Unrecognized archive format'
			) {
				console.log(
					color.yellow(
						'Local degit cache seems to be corrupted. For more information check out this issue: https://github.com/withastro/astro/issues/655.'
					)
				);
				const { cache } = await prompt({
					type: 'confirm',
					name: 'cache',
					message: 'Would you like us to clear the cache and try again?',
					initial: true,
				});

				if (cache) {
					const homeDirectory = os.homedir();
					const cacheDir = path.join(homeDirectory, '.degit', 'github', 'withastro');
					
					fs.rmSync(cacheDir, { recursive: true, force: true, maxRetries: 3 });
					try {
						await emitter.clone(cwd);
					} catch (e: any) {
						if (flags.verbose) {
							console.debug(e);
							console.error(e.message);
						}
					}
				} else {
					info('OK, no worries!', `To fix this manually, remove the folder '~/.degit/github/withastro' and rerun this command.`)
				}
			}

			// Helpful message when encountering the "could not find commit hash for ..." error
			if ((err as any).code === 'MISSING_REF') {
				console.log(
					color.yellow(
						"This seems to be an issue with degit. Please check if you have 'git' installed on your system, and install it if you don't have (https://git-scm.com)."
					)
				);
				console.log(
					color.yellow(
						"If you do have 'git' installed, please run this command with the --verbose flag and file a new issue with the command output here: https://github.com/withastro/astro/issues"
					)
				);
			}

			process.exit(1);
		}

		// Post-process in parallel
		await Promise.all(
			FILES_TO_REMOVE.map(async (file) => {
				const fileLoc = path.resolve(path.join(cwd, file));
				if (fs.existsSync(fileLoc)) {
					return fs.promises.rm(fileLoc, {});
				}
			})
		);
	}
}

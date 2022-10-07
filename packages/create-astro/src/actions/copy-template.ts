/* eslint no-console: 'off' */
import fs from 'node:fs';
import path from 'node:path';

import type { Arguments as Flags } from "yargs-parser";
import { color } from "@astrojs/cli-kit";
import { downloadTemplate } from 'giget';

import { isEmpty } from "./shared.js";

// some files are only needed for online editors when using astro.new. Remove for create-astro installs.
const FILES_TO_REMOVE = ['sandbox.config.json', 'CHANGELOG.md'];
const FILES_TO_UPDATE = {
	'package.json': (file: string, overrides: { name: string }) => fs.promises.readFile(file, 'utf-8').then(value => (
		fs.promises.writeFile(file, JSON.stringify(Object.assign(JSON.parse(value), Object.assign(overrides, { private: undefined })), null, '\t'), 'utf-8')
	))
};

export default async function copyTemplate(template: string, { name, flags, cwd, pkgManager }: { name: string, flags: Flags, cwd: string, pkgManager: string }) {
	const ref = flags.commit ? `#${flags.commit}` : '';
	const isThirdParty = template.includes('/');

	const templateTarget = isThirdParty
		? template
		: `github:withastro/astro/examples/${template}#latest`;

	// Copy
	if (!flags.dryRun) {
		try {		
			await downloadTemplate(`${templateTarget}${ref}`, {
				force: true,
				provider: 'github',
				cwd,
				dir: '.',
			});

			// degit does not return an error when an invalid template is provided, as such we need to handle this manually
			// It's not very pretty, but to the user eye, we just return a nice message and nothing weird happened
			if (isEmpty(cwd)) {
				fs.rmdirSync(cwd);
				throw new Error(`Error: The provided template (${color.cyan(template)}) does not exist`);
			}
		} catch (err: any) {
			console.debug(err);
			console.error(err.message);
			process.exit(1);
		}

		// Post-process in parallel
		const removeFiles = FILES_TO_REMOVE.map(async (file) => {
			const fileLoc = path.resolve(path.join(cwd, file));
			if (fs.existsSync(fileLoc)) {
				return fs.promises.rm(fileLoc, { recursive: true });
			}
		});
		const updateFiles = Object.entries(FILES_TO_UPDATE).map(async ([file, update]) => {
			const fileLoc = path.resolve(path.join(cwd, file));
			if (fs.existsSync(fileLoc)) {
				return update(fileLoc, { name })
			}
		})

		await Promise.all([...removeFiles, ...updateFiles]);
	}
}

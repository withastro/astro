/* eslint-disable no-console */
/* eslint-disable no-shadow */
import * as colors from 'kleur/colors';
import preferredPM from 'preferred-pm';
import { exec as childProcessExec } from 'child_process';
import type { Arguments } from 'yargs-parser';
import { getRawConfig } from '../core/config.js';
import fs from 'fs/promises';
import path from 'path';
import ora from 'ora';
import * as t from '@babel/types';
import { transformFileAsync, NodePath } from '@babel/core';

const issueMsg = '\nIf you think this is an error, feel free to open an issue in our GitHub repo: https://github.com/withastro/astro/issues/new';

const exec = (...command: string[]) =>
	new Promise((resolve, reject) => {
		childProcessExec(command.join(' '), (err, stdout, stderr) => {
			if (err) {
				reject(stderr);
			} else {
				resolve(stdout);
			}
		});
	});

function printHelp() {
	console.log(`  ${colors.bold('astro add')} - Extend Astro capabilities.

  ${colors.bold('Commands:')}
  astro add renderer [NAME]    Add one of the official renderers.

  ${colors.bold('More info at https://docs.astro.build/en/reference/cli-reference#astro-add')}
`);
}

export async function add(args: Arguments): Promise<number> {
	const [whatToAdd = null, ...rest] = args._.slice(3);

	switch (whatToAdd) {
		case 'renderer':
			return await addRenderer(rest);

		default:
			printHelp();
			return 0;
	}
}

async function addRenderer(args: string[]): Promise<number> {
	if (args.length === 0) {
		console.log('You need to specify a renderer to add');
		return 1;
	}

	if (args.length > 1) {
		console.log('This command expects only one argument after `astro add renderer`');
		return 1;
	}

	const renderersData: { name: string; dependencies: string[] }[] = [
		{ name: 'lit', dependencies: ['lit'] },
		{ name: 'preact', dependencies: ['preact'] },
		{ name: 'react', dependencies: ['react', 'react-dom'] },
		{ name: 'solid', dependencies: ['solid-js'] },
		{ name: 'svelte', dependencies: ['svelte'] },
		{ name: 'vue', dependencies: ['vue'] },
	];
	const renderersNames = renderersData.map(renderer => renderer.name);

	const renderer = renderersData.find(r => r.name === args[0]);

	if (!renderer) {
		console.log("You've entered an invalid renderer. It has to be one of the following:\n" + renderersNames.join(', '));
		return 1;
	}

	const pm = await preferredPM(process.cwd());

	if (!pm) {
		console.log("It seems like `astro add` doesn't support your package manager or it couldn't be detected." + issueMsg);
		return 1;
	}

	const dependenciesSpinner = ora('Installing dependencies').start();
	const rendererPackageName = `@astrojs/renderer-${renderer.name}`;
	const dependencies = renderer.dependencies.concat(rendererPackageName);

	try {
		if (pm.name === 'yarn') await exec('yarn', 'add', '--dev', ...dependencies);
		else if (pm.name === 'pnpm') await exec('pnpm', 'add', '--save-dev', ...dependencies);
		else await exec('npm', 'install', '--save-dev', ...dependencies);

		dependenciesSpinner.succeed('Dependencies installed');
	} catch (error) {
		dependenciesSpinner.fail(
			'There was an error installing the dependencies.\n' +
				`You can try to install ${dependencies.join(', ')} with your package manager and add ${rendererPackageName} to your renderers list manually.` +
				issueMsg
		);
		console.error(error);
		return 1;
	}

	const config = await getRawConfig();

	if (!config) {
		const creatingFileSpinner = ora('No config file found. Creating astro.config.mjs').start();

		try {
			await fs.writeFile(path.join(process.cwd(), 'astro.config.mjs'), `export default { resolvers: [${rendererPackageName}] }`, { encoding: 'utf-8' });
			creatingFileSpinner.succeed('Config file created');
		} catch (error) {
			creatingFileSpinner.fail('There was an error creating the config file.' + issueMsg);
			console.error(error);
			return 1;
		}
	} else {
		const updatingConfigSpinner = ora('Updating Astro config').start();

		try {
			const configRenderers = config.raw?.renderers || [];

			if (!Array.isArray(configRenderers)) {
				throw new Error('Invalid `renderers` key in astro config');
			}

			if (configRenderers.includes(rendererPackageName)) {
				updatingConfigSpinner.succeed(`${rendererPackageName} already in astro config.`);
			} else {
				let success = false;
				const result = await transformFileAsync(config.filePath, {
					sourceType: 'unambiguous',
					plugins: [
						() => ({
							visitor: {
								ExportDefaultDeclaration(path: NodePath<t.ExportDefaultDeclaration>) {
									if (success) return;

									if (path.node.declaration.type !== 'ObjectExpression') return;

									const configObject = path.node.declaration;

									let renderersProp = configObject.properties.find(prop => {
										if (prop.type !== 'ObjectProperty') return false;
										if (prop.key.type === 'Identifier') {
											if (prop.key.name === 'renderers') return true;
										}
										if (prop.key.type === 'StringLiteral') {
											if (prop.key.value === 'renderers') return true;
										}
										return false;
									}) as t.ObjectProperty | undefined;

									if (!renderersProp) {
										configObject.properties.push(t.objectProperty(t.identifier('renderers'), t.arrayExpression([t.stringLiteral(rendererPackageName)])));
										success = true;
										return;
									}

									if (renderersProp.value.type !== 'ArrayExpression') return;

									renderersProp.value.elements.push(t.stringLiteral(rendererPackageName));
									success = true;
								},
							},
						}),
					],
				});

				if (!success || !result?.code) {
					throw new Error("Couldn't find config object");
				}

				await fs.writeFile(config.filePath, result.code, { encoding: 'utf-8' });
				updatingConfigSpinner.succeed('Config file updated');
			}
		} catch (error) {
			updatingConfigSpinner.fail('There was an error updating the config file.\n' + `You can try to add ${rendererPackageName} to your renderers list manually.` + issueMsg);
			console.error(error);
			return 1;
		}
	}

	console.log(`${rendererPackageName} added successfully!`);
	return 0;
}

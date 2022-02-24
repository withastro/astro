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

const issueMsg = '\nIf you think this is an error, feel free to open an issue in our GitHub repo: https://github.com/withastro/astro/issues/new';

const exec = (command: string | string[]) =>
	new Promise((resolve, reject) => {
		childProcessExec(typeof command === 'string' ? command : command.join(' '), (err, stdout, stderr) => {
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
	const renderersNames = renderersData.map((renderer) => renderer.name);

	const renderer = renderersData.find((r) => r.name === args[0]);

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
	const dependencies = [rendererPackageName, ...renderer.dependencies];

	try {
		if (pm.name === 'yarn') await exec(['yarn', 'add', '--dev', ...dependencies]);
		else if (pm.name === 'pnpm') await exec(['pnpm', 'add', '--dev', ...dependencies]);
		else await exec(['npm', 'install', '--save-dev', ...dependencies]);

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
			const configRaw = await fs.readFile(config.filePath, { encoding: 'utf-8' });

			let [{ default: generate }, { parse }, { default: traverse }] = await Promise.all([import('@babel/generator'), import('@babel/parser'), import('@babel/traverse')]);

			const ast = parse(configRaw, { sourceType: 'unambiguous' });
			let success = false;

			// @ts-ignore
			if (typeof traverse !== 'function') traverse = traverse.default;
			// @ts-ignore
			if (typeof generate !== 'function') generate = traverse.default;

			traverse(ast, {
				ExportDefaultDeclaration: (path) => {
					if (success) return;
					let configObject: t.ObjectExpression | null = null;

					if (path.node.declaration.type === 'ObjectExpression') {
						configObject = path.node.declaration;
					} else if (path.node.declaration.type === 'Identifier') {
						const identifierName = path.node.declaration.name;
						traverse(ast, {
							VariableDeclaration: (path) => {
								for (const declaration of path.node.declarations) {
									if (declaration.id.type === 'Identifier' && declaration.id.name === identifierName && declaration.init?.type === 'ObjectExpression') {
										configObject = declaration.init;
										break;
									}
								}
							},
						});
					}

					if (!configObject) return;

					let renderersProp = configObject.properties.find((prop) => {
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

					const rendererElement = renderersProp.value.elements.find((el) => el?.type === 'StringLiteral' && el.value === rendererPackageName);
					if (rendererElement) {
						success = true;
						return;
					}

					renderersProp.value.elements.push(t.stringLiteral(rendererPackageName));
					success = true;
				},
			});

			if (!success) {
				throw new Error("Couldn't find config object");
			}

			const output = generate(ast, {}, configRaw);

			await fs.writeFile(config.filePath, output.code, { encoding: 'utf-8' });
			updatingConfigSpinner.succeed('Config file updated');
		} catch (error) {
			updatingConfigSpinner.fail('There was an error updating the config file.\n' + `You can try to add ${rendererPackageName} to your renderers list manually.` + issueMsg);
			console.error(error);
			return 1;
		}
	}

	console.log(`${renderer.name} added successfully!`);
	return 0;
}

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) =>
	function __require() {
		return (
			mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod),
			mod.exports
		);
	};
var __copyProps = (to, from, except, desc) => {
	if ((from && typeof from === 'object') || typeof from === 'function') {
		for (let key of __getOwnPropNames(from))
			if (!__hasOwnProp.call(to, key) && key !== except)
				__defProp(to, key, {
					get: () => from[key],
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
				});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (
	(target = mod != null ? __create(__getProtoOf(mod)) : {}),
	__copyProps(
		// If the importer is in node compatibility mode or this is not an ESM
		// file that has been converted to a CommonJS file using a Babel-
		// compatible transform (i.e. "__esModule" has not been set), then set
		// "default" to the CommonJS "module.exports" for node compatibility.
		isNodeMode || !mod || !mod.__esModule
			? __defProp(target, 'default', { value: mod, enumerable: true })
			: target,
		mod,
	)
);

// ../../node_modules/.pnpm/arg@5.0.2/node_modules/arg/index.js
var require_arg = __commonJS({
	'../../node_modules/.pnpm/arg@5.0.2/node_modules/arg/index.js'(exports, module) {
		var flagSymbol = /* @__PURE__ */ Symbol('arg flag');
		var ArgError = class _ArgError extends Error {
			constructor(msg, code) {
				super(msg);
				this.name = 'ArgError';
				this.code = code;
				Object.setPrototypeOf(this, _ArgError.prototype);
			}
		};
		function arg2(
			opts,
			{ argv = process.argv.slice(2), permissive = false, stopAtPositional = false } = {},
		) {
			if (!opts) {
				throw new ArgError('argument specification object is required', 'ARG_CONFIG_NO_SPEC');
			}
			const result = { _: [] };
			const aliases = {};
			const handlers = {};
			for (const key of Object.keys(opts)) {
				if (!key) {
					throw new ArgError('argument key cannot be an empty string', 'ARG_CONFIG_EMPTY_KEY');
				}
				if (key[0] !== '-') {
					throw new ArgError(
						`argument key must start with '-' but found: '${key}'`,
						'ARG_CONFIG_NONOPT_KEY',
					);
				}
				if (key.length === 1) {
					throw new ArgError(
						`argument key must have a name; singular '-' keys are not allowed: ${key}`,
						'ARG_CONFIG_NONAME_KEY',
					);
				}
				if (typeof opts[key] === 'string') {
					aliases[key] = opts[key];
					continue;
				}
				let type = opts[key];
				let isFlag = false;
				if (Array.isArray(type) && type.length === 1 && typeof type[0] === 'function') {
					const [fn] = type;
					type = (value, name, prev = []) => {
						prev.push(fn(value, name, prev[prev.length - 1]));
						return prev;
					};
					isFlag = fn === Boolean || fn[flagSymbol] === true;
				} else if (typeof type === 'function') {
					isFlag = type === Boolean || type[flagSymbol] === true;
				} else {
					throw new ArgError(
						`type missing or not a function or valid array type: ${key}`,
						'ARG_CONFIG_VAD_TYPE',
					);
				}
				if (key[1] !== '-' && key.length > 2) {
					throw new ArgError(
						`short argument keys (with a single hyphen) must have only one character: ${key}`,
						'ARG_CONFIG_SHORTOPT_TOOLONG',
					);
				}
				handlers[key] = [type, isFlag];
			}
			for (let i = 0, len = argv.length; i < len; i++) {
				const wholeArg = argv[i];
				if (stopAtPositional && result._.length > 0) {
					result._ = result._.concat(argv.slice(i));
					break;
				}
				if (wholeArg === '--') {
					result._ = result._.concat(argv.slice(i + 1));
					break;
				}
				if (wholeArg.length > 1 && wholeArg[0] === '-') {
					const separatedArguments =
						wholeArg[1] === '-' || wholeArg.length === 2
							? [wholeArg]
							: wholeArg
									.slice(1)
									.split('')
									.map((a) => `-${a}`);
					for (let j = 0; j < separatedArguments.length; j++) {
						const arg3 = separatedArguments[j];
						const [originalArgName, argStr] =
							arg3[1] === '-' ? arg3.split(/=(.*)/, 2) : [arg3, void 0];
						let argName = originalArgName;
						while (argName in aliases) {
							argName = aliases[argName];
						}
						if (!(argName in handlers)) {
							if (permissive) {
								result._.push(arg3);
								continue;
							} else {
								throw new ArgError(
									`unknown or unexpected option: ${originalArgName}`,
									'ARG_UNKNOWN_OPTION',
								);
							}
						}
						const [type, isFlag] = handlers[argName];
						if (!isFlag && j + 1 < separatedArguments.length) {
							throw new ArgError(
								`option requires argument (but was followed by another short argument): ${originalArgName}`,
								'ARG_MISSING_REQUIRED_SHORTARG',
							);
						}
						if (isFlag) {
							result[argName] = type(true, argName, result[argName]);
						} else if (argStr === void 0) {
							if (
								argv.length < i + 2 ||
								(argv[i + 1].length > 1 &&
									argv[i + 1][0] === '-' &&
									!(
										argv[i + 1].match(/^-?\d*(\.(?=\d))?\d*$/) &&
										(type === Number || // eslint-disable-next-line no-undef
											(typeof BigInt !== 'undefined' && type === BigInt))
									))
							) {
								const extended = originalArgName === argName ? '' : ` (alias for ${argName})`;
								throw new ArgError(
									`option requires argument: ${originalArgName}${extended}`,
									'ARG_MISSING_REQUIRED_LONGARG',
								);
							}
							result[argName] = type(argv[i + 1], argName, result[argName]);
							++i;
						} else {
							result[argName] = type(argStr, argName, result[argName]);
						}
					}
				} else {
					result._.push(wholeArg);
				}
			}
			return result;
		}
		arg2.flag = (fn) => {
			fn[flagSymbol] = true;
			return fn;
		};
		arg2.COUNT = arg2.flag((v, name, existingCount) => (existingCount || 0) + 1);
		arg2.ArgError = ArgError;
		module.exports = arg2;
	},
});

// src/index.ts
import { tasks } from '@astrojs/cli-kit';

// src/actions/context.ts
var import_arg = __toESM(require_arg(), 1);
import os from 'node:os';
import { prompt } from '@astrojs/cli-kit';
import { random } from '@astrojs/cli-kit/utils';

// src/data/seasonal.ts
function getSeasonalHouston({ fancy }) {
	const season = getSeason();
	switch (season) {
		case 'new-year': {
			const year = /* @__PURE__ */ new Date().getFullYear();
			return {
				hats: rarity(0.5, ['\u{1F3A9}']),
				ties: rarity(0.25, ['\u{1F38A}', '\u{1F380}', '\u{1F389}']),
				messages: [
					`New year, new Astro site!`,
					`Kicking ${year} off with Astro?! What an honor!`,
					`Happy ${year}! Let's make something cool.`,
					`${year} is your year! Let's build something awesome.`,
					`${year} is the year of Astro!`,
					`${year} is clearly off to a great start!`,
					`Thanks for starting ${year} with Astro!`,
				],
			};
		}
		case 'spooky':
			return {
				hats: rarity(0.5, [
					'\u{1F383}',
					'\u{1F47B}',
					'\u2620\uFE0F',
					'\u{1F480}',
					'\u{1F577}\uFE0F',
					'\u{1F52E}',
				]),
				ties: rarity(0.25, ['\u{1F9B4}', '\u{1F36C}', '\u{1F36B}']),
				messages: [
					`I'm afraid I can't help you... Just kidding!`,
					`Boo! Just kidding. Let's make a website!`,
					`Let's haunt the internet. OooOooOOoo!`,
					`No tricks here. Seeing you is always treat!`,
					`Spiders aren't the only ones building the web!`,
					`Let's conjure up some web magic!`,
					`Let's harness the power of Astro to build a frightful new site!`,
					`We're conjuring up a spooktacular website!`,
					`Prepare for a web of spooky wonders to be woven.`,
					`Chills and thrills await you on your new project!`,
				],
			};
		case 'holiday':
			return {
				hats: rarity(0.75, ['\u{1F381}', '\u{1F384}', '\u{1F332}']),
				ties: rarity(0.75, ['\u{1F9E3}']),
				messages: [
					`'Tis the season to code and create.`,
					`Jingle all the way through your web creation journey!`,
					`Bells are ringing, and so are your creative ideas!`,
					`Let's make the internet our own winter wonderland!`,
					`It's time to decorate a brand new website!`,
					`Let's unwrap the magic of the web together!`,
					`Hope you're enjoying the holiday season!`,
					`I'm dreaming of a brand new website!`,
					`No better holiday gift than a new site!`,
					`Your creativity is the gift that keeps on giving!`,
				],
			};
		case void 0:
		default:
			return {
				hats: fancy
					? [
							'\u{1F3A9}',
							'\u{1F3A9}',
							'\u{1F3A9}',
							'\u{1F3A9}',
							'\u{1F393}',
							'\u{1F451}',
							'\u{1F9E2}',
							'\u{1F366}',
						]
					: void 0,
				ties: fancy ? rarity(0.33, ['\u{1F380}', '\u{1F9E3}']) : void 0,
				messages: [
					`Let's claim your corner of the internet.`,
					`I'll be your assistant today.`,
					`Let's build something awesome!`,
					`Let's build something great!`,
					`Let's build something fast!`,
					`Let's build the web we want.`,
					`Let's make the web weird!`,
					`Let's make the web a better place!`,
					`Let's create a new project!`,
					`Let's create something unique!`,
					`Time to build a new website.`,
					`Time to build a faster website.`,
					`Time to build a sweet new website.`,
					`We're glad to have you on board.`,
					`Keeping the internet weird since 2021.`,
					`Initiating launch sequence...`,
					`Initiating launch sequence... right... now!`,
					`Awaiting further instructions.`,
				],
			};
	}
}
function getSeason() {
	const date = /* @__PURE__ */ new Date();
	const month = date.getMonth() + 1;
	const day = date.getDate() + 1;
	if (month === 1 && day <= 7) {
		return 'new-year';
	}
	if (month === 10 && day > 7) {
		return 'spooky';
	}
	if (month === 12 && day > 7 && day < 25) {
		return 'holiday';
	}
}
function rarity(frequency, emoji) {
	if (frequency === 1) return emoji;
	if (frequency === 0) return [''];
	const empty = Array.from({ length: Math.round(emoji.length * frequency) }, () => '');
	return [...emoji, ...empty];
}

// src/messages.ts
import { exec } from 'node:child_process';
import { stripVTControlCharacters } from 'node:util';
import { color, say as houston, label } from '@astrojs/cli-kit';
import { align, sleep } from '@astrojs/cli-kit/utils';

// src/shell.ts
import { spawn } from 'node:child_process';
import { text as textFromStream } from 'node:stream/consumers';
var WINDOWS_CMD_SHIMS = /* @__PURE__ */ new Set(['npm', 'npx', 'pnpm', 'pnpx', 'yarn', 'yarnpkg']);
var WINDOWS_EXE_SHIMS = /* @__PURE__ */ new Set(['bun', 'bunx']);
var text = (stream) => (stream ? textFromStream(stream).then((t) => t.trimEnd()) : '');
function resolveCommand(command, flags) {
	if (process.platform !== 'win32') return [command, flags];
	if (command.includes('/') || command.includes('\\') || command.includes('.'))
		return [command, flags];
	const cmd = command.toLowerCase();
	if (WINDOWS_CMD_SHIMS.has(cmd)) {
		return ['cmd.exe', ['/d', '/s', '/c', `${command}.cmd`, ...flags]];
	}
	if (WINDOWS_EXE_SHIMS.has(cmd)) {
		return [`${command}.exe`, flags];
	}
	return [command, flags];
}
async function shell(command, flags, opts = {}) {
	let child;
	let stdout2 = '';
	let stderr = '';
	try {
		const [resolvedCommand, resolvedFlags] = resolveCommand(command, flags);
		child = spawn(resolvedCommand, resolvedFlags, {
			cwd: opts.cwd,
			stdio: opts.stdio,
			timeout: opts.timeout,
		});
		const done = new Promise((resolve, reject) => {
			child.once('error', reject);
			child.once('close', () => resolve());
		});
		[stdout2, stderr] = await Promise.all([text(child.stdout), text(child.stderr), done]);
	} catch (e) {
		const message = e instanceof Error ? e.message : stderr || 'Unknown error';
		throw new Error(message);
	}
	const { exitCode } = child;
	if (exitCode === null) {
		throw new Error('Timeout');
	}
	if (exitCode !== 0) {
		throw new Error(stderr || `Process exited with code ${exitCode}`);
	}
	return { stdout: stdout2, stderr, exitCode };
}

// src/messages.ts
var _registry;
async function getRegistry(packageManager) {
	if (_registry) return _registry;
	const fallback = 'https://registry.npmjs.org';
	try {
		const { stdout: stdout2 } = await shell(packageManager, ['config', 'get', 'registry']);
		_registry = stdout2?.trim()?.replace(/\/$/, '') || fallback;
		if (!new URL(_registry).host) _registry = fallback;
	} catch {
		_registry = fallback;
	}
	return _registry;
}
var stdout = process.stdout;
function setStdout(writable) {
	stdout = writable;
}
async function say(messages, { clear = false, hat = '', tie = '' } = {}) {
	return houston(messages, { clear, hat, tie, stdout });
}
var title = (text2) => align(label(text2), 'end', 7) + ' ';
var getName = () =>
	new Promise((resolve) => {
		exec('git config user.name', { encoding: 'utf-8' }, (_1, gitName) => {
			if (gitName.trim()) {
				return resolve(gitName.split(' ')[0].trim());
			}
			exec('whoami', { encoding: 'utf-8' }, (_3, whoami) => {
				if (whoami.trim()) {
					return resolve(whoami.split(' ')[0].trim());
				}
				return resolve('astronaut');
			});
		});
	});
var getVersion = (packageManager, packageName, packageTag = 'latest', fallback = '') =>
	new Promise(async (resolve) => {
		let registry = await getRegistry(packageManager);
		const { version } = await fetch(`${registry}/${packageName}/${packageTag}`, {
			redirect: 'follow',
			signal: AbortSignal.timeout(1e4),
		})
			.then((res) => res.json())
			.catch(() => {
				const fallbackName = fallback || `'latest'`;
				console.warn(
					`Unable to fetch latest ${packageName} version from the npm registry. Using ${fallbackName} instead.`,
				);
				return { version: fallback };
			});
		return resolve(version);
	});
var log = (message) => stdout.write(message + '\n');
var banner = () => {
	const prefix = `astro`;
	const suffix = `Launch sequence initiated.`;
	log(`${label(prefix, color.bgGreen, color.black)}  ${suffix}`);
};
var bannerAbort = () =>
	log(`
${label('astro', color.bgRed)} ${color.bold('Launch sequence aborted.')}`);
var info = async (prefix, text2) => {
	await sleep(100);
	if (stdout.columns < 80) {
		log(`${' '.repeat(5)} ${color.cyan('\u25FC')}  ${color.cyan(prefix)}`);
		log(`${' '.repeat(9)}${color.dim(text2)}`);
	} else {
		log(`${' '.repeat(5)} ${color.cyan('\u25FC')}  ${color.cyan(prefix)} ${color.dim(text2)}`);
	}
};
var error = async (prefix, text2) => {
	if (stdout.columns < 80) {
		log(`${' '.repeat(5)} ${color.red('\u25B2')}  ${color.red(prefix)}`);
		log(`${' '.repeat(9)}${color.dim(text2)}`);
	} else {
		log(`${' '.repeat(5)} ${color.red('\u25B2')}  ${color.red(prefix)} ${color.dim(text2)}`);
	}
};
var nextSteps = async ({ projectDir, devCmd }) => {
	const max = stdout.columns;
	const prefix = max < 80 ? ' ' : ' '.repeat(9);
	await sleep(200);
	log(
		`
 ${color.bgCyan(` ${color.black('next')} `)}  ${color.bold(
		'Liftoff confirmed. Explore your project!',
 )}`,
	);
	await sleep(100);
	if (projectDir !== '') {
		projectDir = projectDir.includes(' ') ? `"./${projectDir}"` : `./${projectDir}`;
		const enter = [
			`
${prefix}Enter your project directory using`,
			color.cyan(`cd ${projectDir}`, ''),
		];
		const len = enter[0].length + stripVTControlCharacters(enter[1]).length;
		log(enter.join(len > max ? '\n' + prefix : ' '));
	}
	log(
		`${prefix}Run ${color.cyan(devCmd)} to start the dev server. ${color.cyan('q')} + ${color.cyan('ENTER')} to stop.`,
	);
	await sleep(100);
	log(
		`${prefix}Add frameworks like ${color.cyan(`react`)} or ${color.cyan(
			'tailwind',
		)} using ${color.cyan('astro add')}.`,
	);
	await sleep(100);
	log(`
${prefix}Stuck? Join us at ${color.cyan(`https://astro.build/chat`)}`);
	await sleep(200);
};
function printHelp({ commandName, headline, usage, tables, description }) {
	const linebreak = () => '';
	const table = (rows, { padding }) => {
		const split = stdout.columns < 60;
		let raw = '';
		for (const row of rows) {
			if (split) {
				raw += `    ${row[0]}
    `;
			} else {
				raw += `${`${row[0]}`.padStart(padding)}`;
			}
			raw += '  ' + color.dim(row[1]) + '\n';
		}
		return raw.slice(0, -1);
	};
	let message = [];
	if (headline) {
		message.push(linebreak(), `${title(commandName)} ${color.green(`v${'5.0.6'}`)} ${headline}`);
	}
	if (usage) {
		message.push(linebreak(), `${color.green(commandName)} ${color.bold(usage)}`);
	}
	if (tables) {
		let calculateTablePadding2 = function (rows) {
			return rows.reduce((val, [first]) => Math.max(val, first.length), 0);
		};
		var calculateTablePadding = calculateTablePadding2;
		const tableEntries = Object.entries(tables);
		const padding = Math.max(...tableEntries.map(([, rows]) => calculateTablePadding2(rows)));
		for (const [, tableRows] of tableEntries) {
			message.push(linebreak(), table(tableRows, { padding }));
		}
	}
	if (description) {
		message.push(linebreak(), `${description}`);
	}
	log(message.join('\n') + '\n');
}

// src/actions/context.ts
function getPackageTag(packageSpecifier) {
	switch (packageSpecifier) {
		case 'alpha':
		case 'beta':
		case 'rc':
			return packageSpecifier;
		// Will fall back to latest
		case void 0:
		default:
			return void 0;
	}
}
async function getContext(argv) {
	const packageSpecifier = argv
		.find((argItem) => /^(astro|create-astro)@/.exec(argItem))
		?.split('@')[1];
	const flags = (0, import_arg.default)(
		{
			'--template': String,
			'--ref': String,
			'--yes': Boolean,
			'--no': Boolean,
			'--install': Boolean,
			'--no-install': Boolean,
			'--git': Boolean,
			'--no-git': Boolean,
			'--skip-houston': Boolean,
			'--dry-run': Boolean,
			'--help': Boolean,
			'--fancy': Boolean,
			'--add': [String],
			'-y': '--yes',
			'-n': '--no',
			'-h': '--help',
		},
		{ argv, permissive: true },
	);
	const packageManager = detectPackageManager() ?? 'npm';
	let cwd = flags['_'][0];
	let {
		'--help': help2 = false,
		'--template': template2,
		'--no': no,
		'--yes': yes,
		'--install': install2,
		'--no-install': noInstall,
		'--git': git2,
		'--no-git': noGit,
		'--fancy': fancy,
		'--skip-houston': skipHouston,
		'--dry-run': dryRun,
		'--ref': ref,
		'--add': add,
	} = flags;
	if (add?.length && noInstall) {
		console.error(
			'The --add flag requires dependencies to be installed. Remove --no-install or run `astro add` manually after installation.',
		);
		process.exit(1);
	}
	let projectName2 = cwd;
	if (no) {
		yes = false;
		if (install2 === void 0) install2 = false;
		if (git2 === void 0) git2 = false;
	}
	skipHouston =
		((os.platform() === 'win32' && !fancy) || skipHouston) ??
		[yes, no, install2, git2].some((v) => v !== void 0);
	const { messages, hats, ties } = getSeasonalHouston({ fancy });
	const context = {
		help: help2,
		prompt,
		packageManager,
		username: getName(),
		version: getVersion(packageManager, 'astro', getPackageTag(packageSpecifier), '6.3.3'),
		skipHouston,
		fancy,
		add,
		dryRun,
		projectName: projectName2,
		template: template2,
		ref: ref ?? 'latest',
		welcome: random(messages),
		hat: hats ? random(hats) : void 0,
		tie: ties ? random(ties) : void 0,
		yes,
		install: install2 ?? (noInstall ? false : void 0),
		git: git2 ?? (noGit ? false : void 0),
		cwd,
		exit(code) {
			process.exit(code);
		},
		tasks: [],
	};
	return context;
}
function detectPackageManager() {
	if (!process.env.npm_config_user_agent) return;
	const specifier = process.env.npm_config_user_agent.split(' ')[0];
	const name = specifier.substring(0, specifier.lastIndexOf('/'));
	return name === 'npminstall' ? 'cnpm' : name;
}

// src/actions/dependencies.ts
import fs2 from 'node:fs';
import path2 from 'node:path';

// ../internal-helpers/dist/cli.js
var NPM_PACKAGE_NAME_REGEX = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
function validatePackageName(packageName) {
	return NPM_PACKAGE_NAME_REGEX.test(packageName);
}
function assertValidPackageName(packageName) {
	if (!validatePackageName(packageName)) {
		throw new Error(
			`Invalid package name "${packageName}". Package names must follow npm naming rules: lowercase letters, numbers, hyphens, underscores, and dots. Scoped packages like @org/package are also supported.`,
		);
	}
}

// src/actions/dependencies.ts
import { color as color3 } from '@astrojs/cli-kit';

// src/actions/template.ts
import fs from 'node:fs';
import path from 'node:path';
import { color as color2 } from '@astrojs/cli-kit';
import { downloadTemplate } from '@bluwy/giget-core';
function removeTemplateMarkerSections(content) {
	const pattern = /<!--\s*ASTRO:REMOVE:START\s*-->[\s\S]*?<!--\s*ASTRO:REMOVE:END\s*-->/gi;
	let result = content.replace(pattern, '');
	result = result.replace(/\n{3,}/g, '\n\n');
	return result;
}
function processTemplateReadme(content, packageManager) {
	let processed = removeTemplateMarkerSections(content);
	if (packageManager !== 'npm') {
		processed = processed
			.replace(/\bnpm run\b/g, packageManager)
			.replace(/\bnpm\b/g, packageManager);
	}
	return processed;
}
async function template(ctx) {
	if (!ctx.template && ctx.yes) ctx.template = 'basics';
	if (ctx.template) {
		await info('tmpl', `Using ${color2.reset(ctx.template)}${color2.dim(' as project template')}`);
	} else {
		const { template: tmpl } = await ctx.prompt({
			name: 'template',
			type: 'select',
			label: title('tmpl'),
			message: 'How would you like to start your new project?',
			initial: 'basics',
			choices: [
				{ value: 'basics', label: 'A basic, helpful starter project', hint: '(recommended)' },
				{ value: 'blog', label: 'Use blog template' },
				{ value: 'starlight', label: 'Use docs (Starlight) template' },
				{ value: 'minimal', label: 'Use minimal (empty) template' },
			],
		});
		ctx.template = tmpl;
	}
	if (ctx.dryRun) {
		await info('--dry-run', `Skipping template copying`);
	} else if (ctx.template) {
		ctx.tasks.push({
			pending: 'Template',
			start: 'Template copying...',
			end: 'Template copied',
			while: () =>
				copyTemplate(ctx.template, ctx).catch((e) => {
					if (e instanceof Error) {
						error('error', e.message);
						process.exit(1);
					} else {
						error('error', 'Unable to clone template.');
						process.exit(1);
					}
				}),
		});
	} else {
		ctx.exit(1);
	}
}
var FILES_TO_REMOVE = ['CHANGELOG.md', '.codesandbox'];
var FILES_TO_UPDATE = {
	'package.json': (file, overrides) =>
		fs.promises.readFile(file, 'utf-8').then((value) => {
			const indent = /(^\s+)/m.exec(value)?.[1] ?? '	';
			const packageJson = JSON.parse(value);
			packageJson.name = overrides.name;
			delete packageJson.private;
			return fs.promises.writeFile(file, JSON.stringify(packageJson, null, indent), 'utf-8');
		}),
};
function getTemplateTarget(tmpl, ref = 'latest') {
	if (tmpl === 'starlight' || tmpl.startsWith('starlight/')) {
		const [, starter = 'basics'] = tmpl.split('/');
		return `github:withastro/starlight/examples/${starter}`;
	}
	if (isThirdPartyTemplate(tmpl)) return tmpl;
	if (ref === 'latest') {
		return `github:withastro/astro#examples/${tmpl}`;
	} else {
		return `github:withastro/astro/examples/${tmpl}#${ref}`;
	}
}
function isThirdPartyTemplate(tmpl) {
	if (tmpl === 'starlight' || tmpl.startsWith('starlight/')) return false;
	return tmpl.includes('/');
}
async function copyTemplate(tmpl, ctx) {
	const templateTarget = getTemplateTarget(tmpl, ctx.ref);
	if (!ctx.dryRun) {
		try {
			await downloadTemplate(templateTarget, {
				force: true,
				cwd: ctx.cwd,
				dir: '.',
			});
			const readmePath = path.resolve(ctx.cwd, 'README.md');
			if (fs.existsSync(readmePath)) {
				const readme = fs.readFileSync(readmePath, 'utf8');
				const processedReadme = processTemplateReadme(readme, ctx.packageManager);
				fs.writeFileSync(readmePath, processedReadme);
			}
		} catch (err) {
			if (ctx.cwd !== '.' && ctx.cwd !== './' && !ctx.cwd.startsWith('../')) {
				try {
					fs.rmdirSync(ctx.cwd);
				} catch (_) {}
			}
			if (err.message?.includes('404')) {
				throw new Error(`Template ${color2.reset(tmpl)} ${color2.dim('does not exist!')}`);
			}
			if (err.message) {
				error('error', err.message);
			}
			try {
				if ('cause' in err) {
					error('error', err.cause);
					if ('cause' in err.cause) {
						error('error', err.cause?.cause);
					}
				}
			} catch {}
			throw new Error(`Unable to download template ${color2.reset(tmpl)}`);
		}
		const removeFiles = FILES_TO_REMOVE.map(async (file) => {
			const fileLoc = path.resolve(path.join(ctx.cwd, file));
			if (fs.existsSync(fileLoc)) {
				return fs.promises.rm(fileLoc, { recursive: true });
			}
		});
		const updateFiles = Object.entries(FILES_TO_UPDATE).map(async ([file, update]) => {
			const fileLoc = path.resolve(path.join(ctx.cwd, file));
			if (fs.existsSync(fileLoc)) {
				return update(fileLoc, { name: ctx.projectName });
			}
		});
		await Promise.all([...removeFiles, ...updateFiles]);
	}
}

// src/actions/dependencies.ts
async function dependencies(ctx) {
	let deps = ctx.install ?? ctx.yes;
	if (deps === void 0) {
		({ deps } = await ctx.prompt({
			name: 'deps',
			type: 'confirm',
			label: title('deps'),
			message: `Install dependencies?`,
			hint: 'recommended',
			initial: true,
		}));
		ctx.install = deps;
	}
	ctx.add = ctx.add?.reduce((acc, item) => acc.concat(item.split(',')), []);
	if (ctx.add) {
		for (const addValue of ctx.add) {
			assertValidPackageName(addValue);
		}
	}
	if (deps && ctx.template && isThirdPartyTemplate(ctx.template)) {
		await info(
			'warn',
			`Third-party template detected. Installing dependencies may run lifecycle scripts. Continue only if you trust this template. Use ${color3.bold('--no-install')} to skip automatic install.`,
		);
	}
	if (ctx.dryRun) {
		await info(
			'--dry-run',
			`Skipping dependency installation${ctx.add ? ` and adding ${ctx.add.join(', ')}` : ''}`,
		);
	} else if (deps) {
		ctx.tasks.push({
			pending: 'Dependencies',
			start: `Dependencies installing with ${ctx.packageManager}...`,
			end: 'Dependencies installed',
			onError: (e) => {
				error('error', e);
				error(
					'error',
					`Dependencies failed to install, please run ${color3.bold(
						ctx.packageManager + ' install',
					)} to install them manually after setup.`,
				);
			},
			while: () => install({ packageManager: ctx.packageManager, cwd: ctx.cwd }),
		});
		let add = ctx.add;
		if (add) {
			ctx.tasks.push({
				pending: 'Integrations',
				start: `Adding integrations with astro add`,
				end: 'Integrations added',
				onError: (e) => {
					error('error', e);
					error(
						'error',
						`Failed to add integrations, please run ${color3.bold(
							`astro add ${add.join(' ')}`,
						)} to install them manually after setup.`,
					);
				},
				while: () =>
					astroAdd({ integrations: add, packageManager: ctx.packageManager, cwd: ctx.cwd }),
			});
		}
	} else {
		await info(
			ctx.yes === false ? 'deps [skip]' : 'No problem!',
			'Remember to install dependencies after setup.',
		);
	}
}
async function astroAdd({ integrations, packageManager, cwd }) {
	if (packageManager === 'yarn') await ensureYarnLock({ cwd });
	const command = packageManager === 'npm' ? 'npx' : packageManager;
	const args =
		packageManager === 'npm'
			? ['astro', 'add', ...integrations, '-y']
			: ['dlx', 'astro', 'add', ...integrations, '-y'];
	return shell(command, args, { cwd, timeout: 9e4, stdio: 'ignore' });
}
async function install({ packageManager, cwd }) {
	if (packageManager === 'yarn') await ensureYarnLock({ cwd });
	return shell(packageManager, ['install'], { cwd, timeout: 9e4, stdio: 'ignore' });
}
async function ensureYarnLock({ cwd }) {
	const yarnLock = path2.join(cwd, 'yarn.lock');
	if (fs2.existsSync(yarnLock)) return;
	return fs2.promises.writeFile(yarnLock, '', { encoding: 'utf-8' });
}

// src/actions/git.ts
import fs3 from 'node:fs';
import path3 from 'node:path';
import { color as color4 } from '@astrojs/cli-kit';
async function git(ctx) {
	if (fs3.existsSync(path3.join(ctx.cwd, '.git'))) {
		await info('Nice!', `Git has already been initialized`);
		return;
	}
	let _git = ctx.git ?? ctx.yes;
	if (_git === void 0) {
		({ git: _git } = await ctx.prompt({
			name: 'git',
			type: 'confirm',
			label: title('git'),
			message: `Initialize a new git repository?`,
			hint: 'optional',
			initial: true,
		}));
	}
	if (ctx.dryRun) {
		await info('--dry-run', `Skipping Git initialization`);
	} else if (_git) {
		ctx.tasks.push({
			pending: 'Git',
			start: 'Git initializing...',
			end: 'Git initialized',
			while: () =>
				init({ cwd: ctx.cwd }).catch((e) => {
					error('error', e);
					process.exit(1);
				}),
		});
	} else {
		await info(
			ctx.yes === false ? 'git [skip]' : 'Sounds good!',
			`You can always run ${color4.reset('git init')}${color4.dim(' manually.')}`,
		);
	}
}
async function init({ cwd }) {
	try {
		await shell('git', ['init'], { cwd, stdio: 'ignore' });
		await shell('git', ['add', '-A'], { cwd, stdio: 'ignore' });
		await shell(
			'git',
			[
				'commit',
				'-m',
				'"Initial commit from Astro"',
				'--author="houston[bot] <astrobot-houston@users.noreply.github.com>"',
			],
			{ cwd, stdio: 'ignore' },
		);
	} catch {}
}

// src/actions/help.ts
function help() {
	printHelp({
		commandName: 'create-astro',
		usage: '[dir] [...flags]',
		headline: 'Scaffold Astro projects.',
		tables: {
			Flags: [
				['--help (-h)', 'See all available flags.'],
				['--template <name>', 'Specify your template.'],
				['--install / --no-install', 'Install dependencies (or not).'],
				['--add <integrations>', 'Add integrations.'],
				['--git / --no-git', 'Initialize git repo (or not).'],
				['--yes (-y)', 'Skip all prompts by accepting defaults.'],
				['--no (-n)', 'Skip all prompts by declining defaults.'],
				['--dry-run', 'Walk through steps without executing.'],
				['--skip-houston', 'Skip Houston animation.'],
				['--ref', 'Choose astro branch (default: latest).'],
				['--fancy', 'Enable full Unicode support for Windows.'],
			],
		},
	});
}

// src/actions/intro.ts
import { color as color5, label as label2 } from '@astrojs/cli-kit';
async function intro(ctx) {
	banner();
	if (!ctx.skipHouston) {
		const { welcome, hat, tie } = ctx;
		await say(
			[
				[
					'Welcome',
					'to',
					label2('astro', color5.bgGreen, color5.black),
					Promise.resolve(ctx.version).then(
						(version) => (version ? color5.green(`v${version}`) : '') + ',',
					),
					Promise.resolve(ctx.username).then((username) => `${username}!`),
				],
				welcome ?? "Let's build something awesome!",
			],
			{ clear: true, hat, tie },
		);
	}
}

// src/actions/next-steps.ts
import path4 from 'node:path';
async function next(ctx) {
	let projectDir = path4.relative(process.cwd(), ctx.cwd);
	const commandMap = {
		npm: 'npm run dev',
		bun: 'bun run dev',
		yarn: 'yarn dev',
		pnpm: 'pnpm dev',
	};
	const devCmd = commandMap[ctx.packageManager] || 'npm run dev';
	await nextSteps({ projectDir, devCmd });
	if (!ctx.skipHouston) {
		await say(['Good luck out there, astronaut! \u{1F680}'], { hat: ctx.hat, tie: ctx.tie });
	}
	return;
}

// src/actions/project-name.ts
import path5 from 'node:path';
import { color as color6, generateProjectName } from '@astrojs/cli-kit';

// src/actions/shared.ts
import fs4 from 'node:fs';
var VALID_PROJECT_DIRECTORY_SAFE_LIST = [
	'.DS_Store',
	'.git',
	'.gitkeep',
	'.gitattributes',
	'.gitignore',
	'.gitlab-ci.yml',
	'.hg',
	'.hgcheck',
	'.hgignore',
	'.idea',
	'.npmignore',
	'.travis.yml',
	'.yarn',
	'.yarnrc.yml',
	'docs',
	'LICENSE',
	'mkdocs.yml',
	'Thumbs.db',
	/\.iml$/,
	/^npm-debug\.log/,
	/^yarn-debug\.log/,
	/^yarn-error\.log/,
];
function isEmpty(dirPath) {
	if (!fs4.existsSync(dirPath)) {
		return true;
	}
	const conflicts = fs4.readdirSync(dirPath).filter((content) => {
		return !VALID_PROJECT_DIRECTORY_SAFE_LIST.some((safeContent) => {
			return typeof safeContent === 'string' ? content === safeContent : safeContent.test(content);
		});
	});
	return conflicts.length === 0;
}
function isValidName(projectName2) {
	return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(projectName2);
}
function toValidName(projectName2) {
	if (isValidName(projectName2)) return projectName2;
	return projectName2
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/^[._]/, '')
		.replace(/[^a-z\d\-~]+/g, '-')
		.replace(/^-+/, '')
		.replace(/-+$/, '');
}

// src/actions/project-name.ts
async function projectName(ctx) {
	await checkCwd(ctx.cwd);
	if (!ctx.cwd || !isEmpty(ctx.cwd)) {
		if (ctx.cwd && !isEmpty(ctx.cwd)) {
			await info('Hmm...', `${color6.reset(`"${ctx.cwd}"`)}${color6.dim(` is not empty!`)}`);
		}
		if (ctx.yes) {
			ctx.projectName = generateProjectName();
			ctx.cwd = `./${ctx.projectName}`;
			await info('dir', `Project created at ./${ctx.projectName}`);
			return;
		}
		const { name } = await ctx.prompt({
			name: 'name',
			type: 'text',
			label: title('dir'),
			message: 'Where should we create your new project?',
			initial: `./${generateProjectName()}`,
			validate(value) {
				if (!isEmpty(value)) {
					return `Directory is not empty!`;
				}
				if (value.match(/[^\x20-\x7E]/g) !== null)
					return `Invalid non-printable character present!`;
				return true;
			},
		});
		ctx.cwd = name.trim();
		ctx.projectName = toValidName(name);
		if (ctx.dryRun) {
			await info('--dry-run', 'Skipping project naming');
			return;
		}
	} else {
		let name = ctx.cwd;
		if (name === '.' || name === './') {
			const parts = process.cwd().split(path5.sep);
			name = parts[parts.length - 1];
		} else if (name.startsWith('./') || name.startsWith('../')) {
			const parts = name.split('/');
			name = parts[parts.length - 1];
		}
		ctx.projectName = toValidName(name);
	}
	if (!ctx.cwd) {
		ctx.exit(1);
	}
}
async function checkCwd(cwd) {
	const empty = cwd && isEmpty(cwd);
	if (empty) {
		log('');
		await info('dir', `Using ${color6.reset(cwd)}${color6.dim(' as project directory')}`);
	}
	return empty;
}

// src/actions/verify.ts
import dns from 'node:dns/promises';
import { color as color7 } from '@astrojs/cli-kit';
import { verifyTemplate } from '@bluwy/giget-core';
async function verify(ctx) {
	if (!ctx.dryRun) {
		const online = await isOnline();
		if (!online) {
			bannerAbort();
			log('');
			error('error', `Unable to connect to the internet.`);
			ctx.exit(1);
		}
	}
	if (ctx.template) {
		const target = getTemplateTarget(ctx.template, ctx.ref);
		const ok = await verifyTemplate(target);
		if (!ok) {
			bannerAbort();
			log('');
			error('error', `Template ${color7.reset(ctx.template)} ${color7.dim('could not be found!')}`);
			await info('check', 'https://astro.build/examples');
			ctx.exit(1);
		}
	}
}
function isOnline() {
	return dns.lookup('github.com').then(
		() => true,
		() => false,
	);
}

// src/index.ts
var exit = () => process.exit(0);
process.on('SIGINT', exit);
process.on('SIGTERM', exit);
async function main() {
	console.log('');
	const cleanArgv = process.argv.slice(2).filter((arg2) => arg2 !== '--');
	const ctx = await getContext(cleanArgv);
	if (ctx.help) {
		help();
		return;
	}
	const steps = [
		verify,
		intro,
		projectName,
		template,
		dependencies,
		// Steps which write to files need to go above git
		git,
	];
	for (const step of steps) {
		await step(ctx);
	}
	console.log('');
	const labels = {
		start: 'Project initializing...',
		end: 'Project initialized!',
	};
	await tasks(labels, ctx.tasks);
	await next(ctx);
	process.exit(0);
}
export {
	dependencies,
	getContext,
	git,
	intro,
	main,
	next,
	processTemplateReadme,
	projectName,
	removeTemplateMarkerSections,
	setStdout,
	template,
	verify,
};

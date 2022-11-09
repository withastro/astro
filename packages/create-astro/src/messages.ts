/* eslint no-console: 'off' */
import { color, label } from '@astrojs/cli-kit';
import { sleep } from '@astrojs/cli-kit/utils';
import { exec } from 'node:child_process';
import { get } from 'node:https';
import stripAnsi from 'strip-ansi';

export const welcome = [
	`Let's claim your corner of the internet.`,
	`I'll be your assistant today.`,
	`Let's build something awesome!`,
	`Let's build something great!`,
	`Let's build something fast!`,
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
];

export function getName() {
	return new Promise((resolve) => {
		exec('git config user.name', { encoding: 'utf-8' }, (_1, gitName, _2) => {
			if (gitName.trim()) {
				return resolve(gitName.split(' ')[0].trim());
			}
			exec('whoami', { encoding: 'utf-8' }, (_3, whoami, _4) => {
				if (whoami.trim()) {
					return resolve(whoami.split(' ')[0].trim());
				}
				return resolve('astronaut');
			});
		});
	});
}

let v: string;
export function getVersion() {
	return new Promise<string>((resolve) => {
		if (v) return resolve(v);
		get('https://registry.npmjs.org/astro/latest', (res) => {
			let body = '';
			res.on('data', (chunk) => (body += chunk));
			res.on('end', () => {
				const { version } = JSON.parse(body);
				v = version;
				resolve(version);
			});
		});
	});
}

export async function banner(version: string) {
	return console.log(
		`\n${label('astro', color.bgGreen, color.black)}  ${color.green(
			color.bold(`v${version}`)
		)} ${color.bold('Launch sequence initiated.')}\n`
	);
}

export async function info(prefix: string, text: string) {
	await sleep(100);
	if (process.stdout.columns < 80) {
		console.log(`${color.cyan('◼')}  ${color.cyan(prefix)}`);
		console.log(`${' '.repeat(3)}${color.dim(text)}\n`);
	} else {
		console.log(`${color.cyan('◼')}  ${color.cyan(prefix)} ${color.dim(text)}\n`);
	}
}

export async function error(prefix: string, text: string) {
	if (process.stdout.columns < 80) {
		console.log(`${' '.repeat(5)} ${color.red('▲')}  ${color.red(prefix)}`);
		console.log(`${' '.repeat(9)}${color.dim(text)}`);
	} else {
		console.log(`${' '.repeat(5)} ${color.red('▲')}  ${color.red(prefix)} ${color.dim(text)}`);
	}
}

export async function typescriptByDefault() {
	await info(`Cool!`, 'Astro comes with TypeScript support enabled by default.');
	console.log(
		`${' '.repeat(3)}${color.dim(`We'll default to the most relaxed settings for you.`)}`
	);
	await sleep(300);
}

export async function nextSteps({ projectDir, devCmd }: { projectDir: string; devCmd: string }) {
	const max = process.stdout.columns;
	const prefix = max < 80 ? ' ' : ' '.repeat(9);
	await sleep(200);
	console.log(
		`\n ${color.bgCyan(` ${color.black('next')} `)}  ${color.bold(
			'Liftoff confirmed. Explore your project!'
		)}`
	);

	await sleep(100);
	if (projectDir !== '') {
		const enter = [
			`\n${prefix}Enter your project directory using`,
			color.cyan(`cd ./${projectDir}`, ''),
		];
		const len = enter[0].length + stripAnsi(enter[1]).length;
		console.log(enter.join(len > max ? '\n' + prefix : ' '));
	}
	console.log(
		`${prefix}Run ${color.cyan(devCmd)} to start the dev server. ${color.cyan('CTRL+C')} to stop.`
	);
	await sleep(100);
	console.log(
		`${prefix}Add frameworks like ${color.cyan(`react`)} or ${color.cyan(
			'tailwind'
		)} using ${color.cyan('astro add')}.`
	);
	await sleep(100);
	console.log(`\n${prefix}Stuck? Join us at ${color.cyan(`https://astro.build/chat`)}`);
	await sleep(200);
}

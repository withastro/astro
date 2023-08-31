/* eslint-disable no-console */
import type yargs from 'yargs-parser';
import * as colors from 'kleur/colors';
import { arch, platform } from 'node:os';
import prompts from 'prompts';
import { resolveConfig } from '../../core/config/index.js';
import { ASTRO_VERSION } from '../../core/constants.js';
import { flagsToAstroInlineConfig } from '../flags.js';
import { execSync } from 'node:child_process';

interface InfoOptions {
	flags: yargs.Arguments;
}

export async function printInfo({ flags }: InfoOptions) {
	const rows: Array<[string, string | string[]]> = [
		['Astro', `v${ASTRO_VERSION}`],
		['Node', process.version],
		['System', getSystem()],
		['Package Manager', getPackageManager()],
	]

	const inlineConfig = flagsToAstroInlineConfig(flags);
	try {
		const { userConfig } = await resolveConfig(inlineConfig, 'info');
		rows.push(['Output', userConfig.output ?? 'static'])
		rows.push(['Adapter', userConfig.adapter?.name ?? 'none'])
		const integrations = (userConfig?.integrations ?? [])
			.filter(Boolean)
			.flat()
			.map((i: any) => i?.name)
			.filter(Boolean);
		rows.push(['Integrations', integrations.length > 0 ? integrations : 'none']);
	} catch {}

	let output = '';
	for (const [label, value] of rows) {
		output += printRow(label, value);
	}

	await copyToClipboard(output.trim());
}

const SUPPORTED_SYSTEM = new Set(['darwin', 'win32']);
async function copyToClipboard(text: string) {
	const system = platform();
	if (!SUPPORTED_SYSTEM.has(system)) return;
	
	console.log();
	const { shouldCopy } = await prompts({
		type: 'confirm',
		name: 'shouldCopy',
		message: 'Copy to clipboard?',
		initial: true,
	})
	if (!shouldCopy) return;
	const command = system === 'darwin' ? 'pbcopy' : 'clip';
	try {
		execSync(`echo ${JSON.stringify(text.trim())} | ${command}`, { encoding: 'utf8', stdio: 'ignore' });
	} catch (e) {
		console.error(colors.red(`\nSorry, something went wrong!`) + ` Please copy the text above manually.`);
	}
}

const PLATFORM_TO_OS: Partial<Record<ReturnType<typeof platform>, string>> = {
	darwin: 'macOS',
	win32: 'Windows',
	linux: 'Linux',
}

function getSystem() {
	const system = PLATFORM_TO_OS[platform()] ?? platform();
	return `${system} (${arch()})`;
}

function getPackageManager() {
  if (!process.env.npm_config_user_agent) {
    return 'unknown'
  }
  const specifier = process.env.npm_config_user_agent.split(' ')[0];
  const name = specifier.substring(0, specifier.lastIndexOf('/'));
  return name === 'npminstall' ? 'cnpm' : name;
}

const MAX_PADDING = 25;
function printRow(label: string, value: string | string[]) {
	const padding = MAX_PADDING - label.length;
	const [first, ...rest] = Array.isArray(value) ? value : [value];
	let plaintext = `${label}${' '.repeat(padding)}${first}`;
	let richtext = `${colors.bold(label)}${' '.repeat(padding)}${colors.green(first)}`;
	if (rest.length > 0) {
		for (const entry of rest) {
			plaintext += `\n${' '.repeat(MAX_PADDING)}${entry}`;
			richtext += `\n${' '.repeat(MAX_PADDING)}${colors.green(entry)}`
		}
	}
	plaintext += '\n';
	console.log(richtext);
	return plaintext;
}

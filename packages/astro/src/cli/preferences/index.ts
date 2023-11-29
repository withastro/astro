/* eslint-disable no-console */
import type yargs from 'yargs-parser';
import type { AstroSettings } from '../../@types/astro.js';

import { bold } from 'kleur/colors';
import { fileURLToPath } from 'node:url';

import * as msg from '../../core/messages.js';
import { createLoggerFromFlags, flagsToAstroInlineConfig } from '../flags.js';
import { resolveConfig } from '../../core/config/config.js';
import { createSettings } from '../../core/config/settings.js';
import { coerce, isValidKey, type PreferenceKey } from '../../preferences/index.js';
import { DEFAULT_PREFERENCES } from '../../preferences/defaults.js';
import dlv from 'dlv';
// @ts-expect-error flattie types are mispackaged
import { flattie } from 'flattie';
import { formatWithOptions } from 'node:util';
import { collectErrorMetadata } from '../../core/errors/dev/utils.js';

interface PreferencesOptions {
	flags: yargs.Arguments;
}

const PREFERENCES_SUBCOMMANDS = [
	'get',
	'set',
	'enable',
	'disable',
	'delete',
	'reset',
	'list',
] as const;
export type Subcommand = (typeof PREFERENCES_SUBCOMMANDS)[number];

function isValidSubcommand(subcommand: string): subcommand is Subcommand {
	return PREFERENCES_SUBCOMMANDS.includes(subcommand as Subcommand);
}

export async function preferences(
	subcommand: string,
	key: string,
	value: string | undefined,
	{ flags }: PreferencesOptions
): Promise<number> {
	if (!isValidSubcommand(subcommand) || flags?.help || flags?.h) {
		msg.printHelp({
			commandName: 'astro preferences',
			usage: '[command]',
			tables: {
				Commands: [
					['list', 'Pretty print all current preferences'],
					['list --json', 'Log all current preferences as a JSON object'],
					['get [key]', 'Log current preference value'],
					['set [key] [value]', 'Update preference value'],
					['reset [key]', 'Reset preference value to default'],
					['enable [key]', 'Set a boolean preference to true'],
					['disable [key]', 'Set a boolean preference to false'],
				],
				Flags: [
					[
						'--global',
						'Scope command to global preferences (all Astro projects) rather than the current project',
					],
				],
			},
		});
		return 0;
	}

	const inlineConfig = flagsToAstroInlineConfig(flags);
	const logger = createLoggerFromFlags(flags);
	const { astroConfig } = await resolveConfig(inlineConfig ?? {}, 'dev');
	const settings = await createSettings(astroConfig, fileURLToPath(astroConfig.root));
	const opts: SubcommandOptions = {
		location: flags.global ? 'global' : undefined,
		json: flags.json,
	};

	if (subcommand === 'list') {
		return listPreferences(settings, opts);
	}

	if (subcommand === 'enable' || subcommand === 'disable') {
		key = `${key}.enabled` as PreferenceKey;
	}

	if (!isValidKey(key)) {
		logger.error('preferences', `Unknown preference "${key}"\n`);
		return 1;
	}

	if (subcommand === 'set' && value === undefined) {
		const type = typeof dlv(DEFAULT_PREFERENCES, key);
		console.error(
			msg.formatErrorMessage(
				collectErrorMetadata(new Error(`Please provide a ${type} value for "${key}"`)),
				true
			)
		);
		return 1;
	}

	switch (subcommand) {
		case 'get':
			return getPreference(settings, key, opts);
		case 'set':
			return setPreference(settings, key, value, opts);
		case 'reset':
		case 'delete':
			return resetPreference(settings, key, opts);
		case 'enable':
			return enablePreference(settings, key, opts);
		case 'disable':
			return disablePreference(settings, key, opts);
	}
}

interface SubcommandOptions {
	location?: 'global' | 'project';
	json?: boolean;
}

// Default `location` to "project" to avoid reading default preferencesa
async function getPreference(
	settings: AstroSettings,
	key: PreferenceKey,
	{ location = 'project' }: SubcommandOptions
) {
	try {
		let value = await settings.preferences.get(key, { location });
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			if (Object.keys(value).length === 0) {
				value = dlv(DEFAULT_PREFERENCES, key);
				console.log(msg.preferenceDefaultIntro(key));
			}
			prettyPrint({ [key]: value });
			return 0;
		}
		if (value === undefined) {
			const defaultValue = await settings.preferences.get(key);
			console.log(msg.preferenceDefault(key, defaultValue));
			return 0;
		}
		console.log(msg.preferenceGet(key, value));
		return 0;
	} catch {}
	return 1;
}

async function setPreference(
	settings: AstroSettings,
	key: PreferenceKey,
	value: unknown,
	{ location }: SubcommandOptions
) {
	try {
		const defaultType = typeof dlv(DEFAULT_PREFERENCES, key);
		if (typeof coerce(key, value) !== defaultType) {
			throw new Error(`${key} expects a "${defaultType}" value!`);
		}

		await settings.preferences.set(key, coerce(key, value), { location });
		console.log(msg.preferenceSet(key, value));
		return 0;
	} catch (e) {
		if (e instanceof Error) {
			console.error(msg.formatErrorMessage(collectErrorMetadata(e), true));
			return 1;
		}
		throw e;
	}
}

async function enablePreference(
	settings: AstroSettings,
	key: PreferenceKey,
	{ location }: SubcommandOptions
) {
	try {
		await settings.preferences.set(key, true, { location });
		console.log(msg.preferenceEnabled(key.replace('.enabled', '')));
		return 0;
	} catch {}
	return 1;
}

async function disablePreference(
	settings: AstroSettings,
	key: PreferenceKey,
	{ location }: SubcommandOptions
) {
	try {
		await settings.preferences.set(key, false, { location });
		console.log(msg.preferenceDisabled(key.replace('.enabled', '')));
		return 0;
	} catch {}
	return 1;
}

async function resetPreference(
	settings: AstroSettings,
	key: PreferenceKey,
	{ location }: SubcommandOptions
) {
	try {
		await settings.preferences.set(key, undefined as any, { location });
		console.log(msg.preferenceReset(key));
		return 0;
	} catch {}
	return 1;
}

async function listPreferences(settings: AstroSettings, { location, json }: SubcommandOptions) {
	const store = await settings.preferences.getAll({ location });
	if (json) {
		console.log(JSON.stringify(store, null, 2));
		return 0;
	}
	prettyPrint(store);
	return 0;
}

function prettyPrint(value: Record<string, string | number | boolean>) {
	const flattened = flattie(value);
	const table = formatTable(flattened, ['Preference', 'Value']);
	console.log(table);
}

const chars = {
	h: '─',
	hThick: '━',
	hThickCross: '┿',
	v: '│',
	vRight: '├',
	vRightThick: '┝',
	vLeft: '┤',
	vLeftThick: '┥',
	hTop: '┴',
	hBottom: '┬',
	topLeft: '╭',
	topRight: '╮',
	bottomLeft: '╰',
	bottomRight: '╯',
};

function formatTable(
	object: Record<string, string | number | boolean>,
	columnLabels: [string, string]
) {
	const [colA, colB] = columnLabels;
	const colALength = [colA, ...Object.keys(object)].reduce(longest, 0) + 3;
	const colBLength = [colB, ...Object.values(object)].reduce(longest, 0) + 3;
	function formatRow(
		i: number,
		a: string,
		b: string | number | boolean,
		style: (value: string | number | boolean) => string = (v) => v.toString()
	): string {
		return `${chars.v} ${style(a)} ${space(colALength - a.length - 2)} ${chars.v} ${style(
			b
		)} ${space(colBLength - b.toString().length - 3)} ${chars.v}`;
	}
	const top = `${chars.topLeft}${chars.h.repeat(colALength + 1)}${chars.hBottom}${chars.h.repeat(
		colBLength
	)}${chars.topRight}`;
	const bottom = `${chars.bottomLeft}${chars.h.repeat(colALength + 1)}${chars.hTop}${chars.h.repeat(
		colBLength
	)}${chars.bottomRight}`;
	const divider = `${chars.vRightThick}${chars.hThick.repeat(colALength + 1)}${
		chars.hThickCross
	}${chars.hThick.repeat(colBLength)}${chars.vLeftThick}`;
	const rows: string[] = [top, formatRow(-1, colA, colB, bold), divider];
	let i = 0;
	for (const [key, value] of Object.entries(object)) {
		rows.push(formatRow(i, key, value, (v) => formatWithOptions({ colors: true }, v)));
		i++;
	}
	rows.push(bottom);
	return rows.join('\n');
}

function space(len: number) {
	return ' '.repeat(len);
}

const longest = (a: number, b: string | number | boolean) => {
	const { length: len } = b.toString();
	return a > len ? a : len;
};

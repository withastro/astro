/* eslint-disable no-console */
import type yargs from 'yargs-parser';
import type { AstroSettings } from '../../@types/astro.js';

import { cyan } from 'kleur/colors';
import { fileURLToPath } from 'node:url';

import * as msg from '../../core/messages.js';
import { createLoggerFromFlags, flagsToAstroInlineConfig } from '../flags.js';
import { resolveConfig } from '../../core/config/config.js';
import { createSettings } from '../../core/config/settings.js';
import { isValidKey, type PreferenceKey } from '../../preferences/index.js';
import { DEFAULT_PREFERENCES } from '../../preferences/defaults.js';
import dlv from 'dlv';


interface PreferencesOptions {
	flags: yargs.Arguments;
}

const PREFERENCES_SUBCOMMANDS = ['get', 'set', 'enable', 'disable', 'delete', 'reset', 'list'] as const;
export type Subcommand = typeof PREFERENCES_SUBCOMMANDS[number];

function isValidSubcommand(subcommand: string): subcommand is Subcommand {
	return PREFERENCES_SUBCOMMANDS.includes(subcommand as Subcommand);
}

export async function preferences(subcommand: string, key: string, value: string | undefined, { flags }: PreferencesOptions): Promise<number> {
	if (!isValidSubcommand(subcommand) || flags?.help || flags?.h) {
		msg.printHelp({
			commandName: 'astro preferences',
			usage: 'set [key] [:value]',
			tables: {
				Flags: [
					['--global', 'Change setting value globally.'],
					['--help (-h)', 'See all available flags.'],
				],
			},
			description: `Starts a local server to serve your static dist/ directory. Check ${cyan(
				'https://docs.astro.build/en/reference/cli-reference/#astro-preview'
			)} for more information.`,
		});
		return 0;
	}

	const inlineConfig = flagsToAstroInlineConfig(flags);
	const logger = createLoggerFromFlags(flags);
	const { astroConfig } = await resolveConfig(inlineConfig ?? {}, 'dev');
	const settings = await createSettings(astroConfig, fileURLToPath(astroConfig.root));
	const opts: SubcommandOptions = {
		location: flags.global ? 'global' : undefined,
		json: flags.json
	}

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
		// TODO: better error message
		logger.error('preferences', `Please provide a ${type} value for "${key}"\n`);
		return 1;
	}

	switch (subcommand) {
		case 'get': return getPreference(settings, key, opts);
		case 'set': return setPreference(settings, key, value, opts);
		case 'reset':
		case 'delete': return resetPreference(settings, key, opts);
		case 'enable': return enablePreference(settings, key, opts);
		case 'disable': return disablePreference(settings, key, opts);
	}
}

interface SubcommandOptions {
	location?: 'global' | 'project';
	json?: boolean;
}

// Default `location` to "project" to avoid reading default preferencesa
async function getPreference(settings: AstroSettings, key: PreferenceKey, { location = 'project' }: SubcommandOptions) {
	try {
		const value = await settings.preferences.get(key, { location });
		// TODO: guard against printing objects
		if (value !== undefined) {
			console.log(msg.preferenceGet(key, value));
		} else {
			const defaultValue = await settings.preferences.get(key);
			console.log(msg.preferenceDefault(key, defaultValue));
		}
		return 0;
	} catch {}
	return 1;
}

async function setPreference(settings: AstroSettings, key: PreferenceKey, value: unknown, { location }: SubcommandOptions) {
	try {
		await settings.preferences.set(key, value as any, { location });
		console.log(msg.preferenceSet(key, value))
		return 0;
	} catch {}
	return 1;
}

async function enablePreference(settings: AstroSettings, key: PreferenceKey, { location }: SubcommandOptions) {
	try {
		await settings.preferences.set(key, true, { location });
		console.log(msg.preferenceEnabled(key.replace('.enabled', '')))
		return 0;
	} catch {}
	return 1;
}

async function disablePreference(settings: AstroSettings, key: PreferenceKey, { location }: SubcommandOptions) {
	try {
		await settings.preferences.set(key, false, { location });
		console.log(msg.preferenceDisabled(key.replace('.enabled', '')))
		return 0;
	} catch {}
	return 1;
}

async function resetPreference(settings: AstroSettings, key: PreferenceKey, { location }: SubcommandOptions) {
	try {
		await settings.preferences.set(key, undefined as any, { location });
		console.log(msg.preferenceReset(key))
		return 0;
	} catch {}
	return 1;
}

async function listPreferences(settings: AstroSettings, { location, json }: SubcommandOptions) {
	const store = await settings.preferences.getAll({ location });
	if (json) {
		console.log(JSON.stringify(store, null, 2));
	}
	// TODO: pretty print
	console.log(JSON.stringify(store, null, 2));
	return 0;
}

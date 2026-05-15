import { fileURLToPath } from 'node:url';
import { formatWithOptions } from 'node:util';
import { flattie } from 'flattie';
import colors from 'piccolore';
import { resolveConfig } from '../../core/config/config.js';
import { createSettings } from '../../core/config/settings.js';
import { collectErrorMetadata } from '../../core/errors/dev/utils.js';
import * as msg from '../../core/messages/runtime.js';
import { DEFAULT_PREFERENCES } from '../../preferences/defaults.js';
import dlv from '../../preferences/dlv.js';
import { coerce, isValidKey } from '../../preferences/index.js';
import { flagsToAstroInlineConfig } from '../flags.js';
import { loadOrCreateNodeLogger } from '../../core/logger/load.js';
const { bgGreen, black, bold, dim, yellow } = colors;
const PREFERENCES_SUBCOMMANDS = ['get', 'set', 'enable', 'disable', 'delete', 'reset', 'list'];
function isValidSubcommand(subcommand) {
	return PREFERENCES_SUBCOMMANDS.includes(subcommand);
}
async function preferences(subcommand, key, value, { flags }) {
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
	const { astroConfig } = await resolveConfig(inlineConfig ?? {}, 'dev');
	const logger = await loadOrCreateNodeLogger(astroConfig, inlineConfig ?? {});
	const settings = await createSettings(
		astroConfig,
		inlineConfig.logLevel,
		fileURLToPath(astroConfig.root),
	);
	const opts = {
		location: flags.global ? 'global' : void 0,
		json: !!flags.json,
	};
	if (subcommand === 'list') {
		return listPreferences(settings, opts);
	}
	if (subcommand === 'enable' || subcommand === 'disable') {
		key = `${key}.enabled`;
	}
	if (!isValidKey(key)) {
		logger.error(
			'preferences',
			`Unknown preference "${key}"
`,
		);
		return 1;
	}
	if (subcommand === 'set' && value === void 0) {
		const type = typeof dlv(DEFAULT_PREFERENCES, key);
		console.error(
			msg.formatErrorMessage(
				collectErrorMetadata(new Error(`Please provide a ${type} value for "${key}"`)),
				true,
			),
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
async function getPreference(settings, key, { location = 'project' }) {
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
		if (value === void 0) {
			const defaultValue = await settings.preferences.get(key);
			console.log(msg.preferenceDefault(key, defaultValue));
			return 0;
		}
		console.log(msg.preferenceGet(key, value));
		return 0;
	} catch {}
	return 1;
}
async function setPreference(settings, key, value, { location }) {
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
async function enablePreference(settings, key, { location }) {
	try {
		await settings.preferences.set(key, true, { location });
		console.log(msg.preferenceEnabled(key.replace('.enabled', '')));
		return 0;
	} catch {}
	return 1;
}
async function disablePreference(settings, key, { location }) {
	try {
		await settings.preferences.set(key, false, { location });
		console.log(msg.preferenceDisabled(key.replace('.enabled', '')));
		return 0;
	} catch {}
	return 1;
}
async function resetPreference(settings, key, { location }) {
	try {
		await settings.preferences.set(key, void 0, { location });
		console.log(msg.preferenceReset(key));
		return 0;
	} catch {}
	return 1;
}
function annotate(flat, annotation) {
	return Object.fromEntries(
		Object.entries(flat).map(([key, value]) => [key, { annotation, value }]),
	);
}
function userValues(flatDefault, flatProject, flatGlobal) {
	const result = {};
	for (const key of Object.keys(flatDefault)) {
		if (key in flatProject) {
			result[key] = {
				value: flatProject[key],
				annotation: '',
			};
			if (key in flatGlobal) {
				result[key].annotation += ` (also modified globally)`;
			}
		} else if (key in flatGlobal) {
			result[key] = { value: flatGlobal[key], annotation: '(global)' };
		}
	}
	return result;
}
async function listPreferences(settings, { location, json }) {
	if (json) {
		const resolved = await settings.preferences.getAll();
		console.log(JSON.stringify(resolved, null, 2));
		return 0;
	}
	const { global, project, fromAstroConfig, defaults } = await settings.preferences.list({
		location,
	});
	const flatProject = flattie(project);
	const flatGlobal = flattie(global);
	const flatDefault = flattie(defaults);
	const flatUser = userValues(flatDefault, flatProject, flatGlobal);
	const userKeys = Object.keys(flatUser);
	if (userKeys.length > 0) {
		const badge = bgGreen(black(` Your Preferences `));
		const table = formatTable(flatUser, ['Preference', 'Value']);
		console.log(['', badge, table].join('\n'));
	} else {
		const badge = bgGreen(black(` Your Preferences `));
		const message = dim('No preferences set');
		console.log(['', badge, '', message].join('\n'));
	}
	const flatUnset = annotate(Object.assign({}, flatDefault), '');
	for (const key of userKeys) {
		delete flatUnset[key];
	}
	const unsetKeys = Object.keys(flatUnset);
	if (unsetKeys.length > 0) {
		const badge = bgGreen(black(` Default Preferences `));
		const table = formatTable(flatUnset, ['Preference', 'Value']);
		console.log(['', badge, table].join('\n'));
	} else {
		const badge = bgGreen(black(` Default Preferences `));
		const message = dim('All preferences have been set');
		console.log(['', badge, '', message].join('\n'));
	}
	if (
		fromAstroConfig.devToolbar?.enabled === false &&
		flatUser['devToolbar.enabled']?.value !== false
	) {
		console.log(
			yellow(
				'The dev toolbar is currently disabled. To enable it, set devToolbar: {enabled: true} in your astroConfig file.',
			),
		);
	}
	return 0;
}
function prettyPrint(value) {
	const flattened = flattie(value);
	const table = formatTable(flattened, ['Preference', 'Value']);
	console.log(table);
}
const chars = {
	h: '\u2500',
	hThick: '\u2501',
	hThickCross: '\u253F',
	v: '\u2502',
	vRight: '\u251C',
	vRightThick: '\u251D',
	vLeft: '\u2524',
	vLeftThick: '\u2525',
	hTop: '\u2534',
	hBottom: '\u252C',
	topLeft: '\u256D',
	topRight: '\u256E',
	bottomLeft: '\u2570',
	bottomRight: '\u256F',
};
function annotatedFormat(mv) {
	return mv.annotation ? `${mv.value} ${mv.annotation}` : mv.value.toString();
}
function formatAnnotated(mv, style = (v) => v.toString()) {
	return mv.annotation
		? `${style(String(mv.value))} ${dim(mv.annotation)}`
		: style(String(mv.value));
}
function formatTable(object, columnLabels) {
	const [colA, colB] = columnLabels;
	const colALength = [colA, ...Object.keys(object)].reduce(longest, 0) + 3;
	const colBLength = [colB, ...Object.values(object).map(annotatedFormat)].reduce(longest, 0) + 3;
	function formatRow(_i, a, b, style = (v) => v.toString()) {
		return `${dim(chars.v)} ${style(a)} ${space(colALength - a.length - 2)} ${dim(
			chars.v,
		)} ${formatAnnotated(b, style)} ${space(colBLength - annotatedFormat(b).length - 3)} ${dim(
			chars.v,
		)}`;
	}
	const top = dim(
		`${chars.topLeft}${chars.h.repeat(colALength + 1)}${chars.hBottom}${chars.h.repeat(
			colBLength,
		)}${chars.topRight}`,
	);
	const bottom = dim(
		`${chars.bottomLeft}${chars.h.repeat(colALength + 1)}${chars.hTop}${chars.h.repeat(
			colBLength,
		)}${chars.bottomRight}`,
	);
	const divider = dim(
		`${chars.vRightThick}${chars.hThick.repeat(colALength + 1)}${chars.hThickCross}${chars.hThick.repeat(colBLength)}${chars.vLeftThick}`,
	);
	const rows = [top, formatRow(-1, colA, { value: colB, annotation: '' }, bold), divider];
	let i = 0;
	for (const [key, value] of Object.entries(object)) {
		rows.push(formatRow(i, key, value, (v) => formatWithOptions({ colors: true }, v)));
		i++;
	}
	rows.push(bottom);
	return rows.join('\n');
}
function space(len) {
	return ' '.repeat(len);
}
const longest = (a, b) => {
	const { length: len } = b.toString();
	return a > len ? a : len;
};
export { preferences };

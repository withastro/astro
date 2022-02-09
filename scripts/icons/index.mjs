import fetch from 'node-fetch';
import fs from 'fs/promises';

const EXPECTED_CONFLICTS = new Set([
	'Adobe',
	'Android',
	'Apple',
	'Bluetooth',
	'Discord',
	'Facebook',
	'Hive',
	'Paypal',
	'Php',
	'Quora',
	'Reddit',
	'Shopify',
	'Snapchat',
	'Telegram',
	'Tiktok',
	'Usb',
	'Whatsapp',
	'Wordpress',
	'AddCircleOutline',
	'ChatBubbleOutline',
	'CheckCircleOutline',
	'DeleteOutline',
	'DoneOutline',
	'ErrorOutline',
	'HelpOutline',
	'MailOutline',
	'ModeEditOutline',
	'PauseCircleOutline',
	'PeopleOutline',
	'PersonOutline',
	'PieChartOutline',
	'PlayCircleOutline',
	'RemoveCircleOutline',
	'StarOutline',
	'WorkOutline',
]);

let uniqueIconIds = new Set();
let uniqueIconSvgs = new Map();
let collectedConflicts = new Set();
const finalDestination = new URL('../../packages/astro/icons/index.js', import.meta.url);

function getVariableNameFromIconName(name) {
	return name.replace(/(^.)|(\-[a-z0-9])/g, (v) => v.toUpperCase()).replace(/\-/g, '');
}

async function processIconPack(type, url, filterMap = (a) => a) {
	let result = '';
	let icons = await fetch(url).then((r) => r.json());
	for (const [_iconKey, iconVal] of Object.entries(icons.icons)) {
		const iconKey = filterMap(_iconKey);
		if (!iconKey) {
			continue;
		}
		const iconId = getVariableNameFromIconName(iconKey, type);
		if (uniqueIconSvgs.has(iconVal.body) && iconId.endsWith('Outline')) {
			continue;
		}
		if (uniqueIconIds.has(iconId)) {
			collectedConflicts.add(iconId);
			if (!EXPECTED_CONFLICTS.has(iconId)) {
				console.log('verbose: conflict -', iconId);
			}
			continue;
		}
		uniqueIconIds.add(iconId);
		if (uniqueIconSvgs.has(iconVal.body)) {
			result += `export const Icon${iconId}${type} = ${uniqueIconSvgs.get(iconVal.body)};\n`;
			continue;
		}
		uniqueIconSvgs.set(iconVal.body, `Icon${iconId}${type}`);
		result += `export const Icon${iconId}${type} = ${JSON.stringify(iconVal.body)};\n`;
	}
	return result;
}

export async function buildIcons() {
	const logoContent = await processIconPack('Logo', `https://unpkg.com/@iconify-json/fa-brands@1/icons.json`);
	const iconContent = await processIconPack('', `https://unpkg.com/@iconify-json/ic@1/icons.json`, (a) => {
		const [type, ...iconName] = a.split('-');
		if (type === 'round' || type === 'sharp' || type === 'twotone') {
			return false;
		}
		if (type === 'baseline') {
			return iconName.join('-');
		}
		if (type === 'outline') {
			return iconName.join('-') + '-outline';
		}
		// For some reason, this one is an odd duplicate. Ignore it.
		if (a === 'content-cut') {
			return false;
		}
		throw new Error('Unexpected! ' + a);
	});
	// Write the result to disk.
	const finalModuleContent = `${iconContent}\n${logoContent}`;
	await fs.mkdir(new URL('./', finalDestination), { recursive: true });
	await fs.writeFile(finalDestination, finalModuleContent, { encoding: 'utf-8' });
	// Finish up, user output.
	console.log(`Script done.`);
	if (EXPECTED_CONFLICTS.length !== collectedConflicts.length) {
		console.log(`\nTo update expected conflicts, update the first line of scripts/icons/index.mjs with the following:`);
		console.log(`\n  const EXPECTED_CONFLICTS = new Set(${JSON.stringify([...collectedConflicts])});\n`);
	}
}

buildIcons();

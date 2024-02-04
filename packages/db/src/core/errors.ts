import { cyan, bold, red } from 'kleur/colors';

export const APP_TOKEN_ERROR = `${red(
	'⚠️ App token invalid or expired.'
)} Please generate a new one from your the Studio dashboard under project settings.`;

export const STUDIO_CONFIG_MISSING_WRITABLE_COLLECTIONS_ERROR = (collectionName: string) =>
	red(`⚠️ Writable collection ${bold(collectionName)} requires Astro Studio.`) +
	` Visit ${cyan('https://astro.build/studio')} to create your account` +
	` and then set ${bold('studio: true')} in your astro.config.js file to enable.`;

export const STUDIO_CONFIG_MISSING_CLI_ERROR =
	red('⚠️ This command requires Astro Studio.') +
	` Visit ${cyan('https://astro.build/studio')} to create your account` +
	` and then set ${bold('studio: true')} in your astro.config.js file to enable.`;

import { cyan, bold, red } from 'kleur/colors';

export const MISSING_SESSION_ID_ERROR = `${red(
	'⚠️ Login required.'
)} Run ${bold('astro db login')} to authenticate with Astro Studio.`;

export const MISSING_PROJECT_ID_ERROR = `${red(
	'⚠️ Directory not linked.'
)} Run ${bold('astro db link')} to link this directory to an Astro Studio project.`;

export const STUDIO_CONFIG_MISSING_WRITABLE_COLLECTIONS_ERROR = (collectionName: string) =>
	red(`⚠️ Writable collection ${bold(collectionName)} requires Astro Studio.`) +
	` Visit ${cyan('https://astro.build/studio')} to create your account` +
	` and then set ${bold('studio: true')} in your astro.config.js file to enable.`;

export const STUDIO_CONFIG_MISSING_CLI_ERROR =
	red('⚠️ This command requires Astro Studio.') +
	` Visit ${cyan('https://astro.build/studio')} to create your account` +
	` and then set ${bold('studio: true')} in your astro.config.js file to enable.`;

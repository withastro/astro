import { red } from 'kleur/colors';

export const unexpectedAstroAdminError = `${red(
	'Unexpected response from Astro Studio servers.'
)} Try updating your package version. If the problem persists, please contact support.`;
export const authenticationError = `${red(
	'⚠️ Login session invalid or expired.'
)} Please run \`astro login\` again.`;
export const appTokenError = `${red(
	'⚠️ App token invalid or expired.'
)} Please generate a new one from your the Studio dashboard under project settings.`;

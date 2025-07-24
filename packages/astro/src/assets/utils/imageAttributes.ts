import { toStyleString } from '../../runtime/server/render/util.js';

export const cssFitValues = ['fill', 'contain', 'cover', 'scale-down'];

export function addCSSVarsToStyle(
	vars: Record<string, string | false | undefined>,
	styles?: string | Record<string, any>,
) {
	const cssVars = Object.entries(vars)
		.filter(([_, value]) => value !== undefined && value !== false)
		.map(([key, value]) => `--${key}: ${value};`)
		.join(' ');

	if (!styles) {
		return cssVars;
	}
	const style = typeof styles === 'string' ? styles : toStyleString(styles);

	return `${cssVars} ${style}`;
}

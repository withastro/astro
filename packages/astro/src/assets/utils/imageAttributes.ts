import { toStyleString } from '../../runtime/server/render/util.js';

export function addCSSVarsToStyle(
	vars: Record<string, string>,
	styles?: string | Record<string, any>,
) {
	const cssVars = Object.entries(vars)
		.map(([key, value]) => `--${key}: ${value};`)
		.join(' ');

	if (!styles) {
		return cssVars;
	}
	const style = typeof styles === 'string' ? styles : toStyleString(styles);

	return `${cssVars} ${style}`;
}

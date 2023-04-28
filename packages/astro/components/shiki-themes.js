/**
 * This file is prebuilt from packages/astro/scripts/shiki-gen-themes.mjs
 * Do not edit this directly, but instead edit that file and rerun it to generate this file.
 */

// prettier-ignore
export const themes = {
	'css-variables': () => import('shiki/themes/css-variables.json').then(mod => mod.default),
	'dark-plus': () => import('shiki/themes/dark-plus.json').then(mod => mod.default),
	'dracula-soft': () => import('shiki/themes/dracula-soft.json').then(mod => mod.default),
	'dracula': () => import('shiki/themes/dracula.json').then(mod => mod.default),
	'github-dark-dimmed': () => import('shiki/themes/github-dark-dimmed.json').then(mod => mod.default),
	'github-dark': () => import('shiki/themes/github-dark.json').then(mod => mod.default),
	'github-light': () => import('shiki/themes/github-light.json').then(mod => mod.default),
	'hc_light': () => import('shiki/themes/hc_light.json').then(mod => mod.default),
	'light-plus': () => import('shiki/themes/light-plus.json').then(mod => mod.default),
	'material-theme-darker': () => import('shiki/themes/material-theme-darker.json').then(mod => mod.default),
	'material-theme-lighter': () => import('shiki/themes/material-theme-lighter.json').then(mod => mod.default),
	'material-theme-ocean': () => import('shiki/themes/material-theme-ocean.json').then(mod => mod.default),
	'material-theme-palenight': () => import('shiki/themes/material-theme-palenight.json').then(mod => mod.default),
	'material-theme': () => import('shiki/themes/material-theme.json').then(mod => mod.default),
	'min-dark': () => import('shiki/themes/min-dark.json').then(mod => mod.default),
	'min-light': () => import('shiki/themes/min-light.json').then(mod => mod.default),
	'monokai': () => import('shiki/themes/monokai.json').then(mod => mod.default),
	'nord': () => import('shiki/themes/nord.json').then(mod => mod.default),
	'one-dark-pro': () => import('shiki/themes/one-dark-pro.json').then(mod => mod.default),
	'poimandres': () => import('shiki/themes/poimandres.json').then(mod => mod.default),
	'rose-pine-dawn': () => import('shiki/themes/rose-pine-dawn.json').then(mod => mod.default),
	'rose-pine-moon': () => import('shiki/themes/rose-pine-moon.json').then(mod => mod.default),
	'rose-pine': () => import('shiki/themes/rose-pine.json').then(mod => mod.default),
	'slack-dark': () => import('shiki/themes/slack-dark.json').then(mod => mod.default),
	'slack-ochin': () => import('shiki/themes/slack-ochin.json').then(mod => mod.default),
	'solarized-dark': () => import('shiki/themes/solarized-dark.json').then(mod => mod.default),
	'solarized-light': () => import('shiki/themes/solarized-light.json').then(mod => mod.default),
	'vitesse-dark': () => import('shiki/themes/vitesse-dark.json').then(mod => mod.default),
	'vitesse-light': () => import('shiki/themes/vitesse-light.json').then(mod => mod.default),
	// old theme names for compat
	'material-darker': () => import('shiki/themes/material-theme-darker').then(mod => mod.default),
	'material-default': () => import('shiki/themes/material-theme').then(mod => mod.default),
	'material-lighter': () => import('shiki/themes/material-theme-lighter').then(mod => mod.default),
	'material-ocean': () => import('shiki/themes/material-theme-ocean').then(mod => mod.default),
	'material-palenight': () => import('shiki/themes/material-theme-palenight').then(mod => mod.default),
};

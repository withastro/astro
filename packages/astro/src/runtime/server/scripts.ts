import type { SSRResult } from '../../@types/astro';

import idlePrebuilt from '../client/idle.prebuilt.js';
import loadPrebuilt from '../client/load.prebuilt.js';
import mediaPrebuilt from '../client/media.prebuilt.js';
import onlyPrebuilt from '../client/only.prebuilt.js';
import visiblePrebuilt from '../client/visible.prebuilt.js';
import islandScript from './astro-island.prebuilt.js';

export function determineIfNeedsHydrationScript(result: SSRResult): boolean {
	if (result._metadata.hasHydrationScript) {
		return false;
	}
	return (result._metadata.hasHydrationScript = true);
}

const ISLAND_STYLES = `<style>astro-island,astro-slot{display:contents}</style>`;

export const hydrationScripts: Record<string, string> = {
	idle: idlePrebuilt,
	load: loadPrebuilt,
	only: onlyPrebuilt,
	media: mediaPrebuilt,
	visible: visiblePrebuilt,
};

export function determinesIfNeedsDirectiveScript(result: SSRResult, directive: string): boolean {
	if (result._metadata.hasDirectives.has(directive)) {
		return false;
	}
	result._metadata.hasDirectives.add(directive);
	return true;
}

export type PrescriptType = null | 'both' | 'directive';

function getDirectiveScriptText(directive: string): string {
	if (!(directive in hydrationScripts)) {
		throw new Error(`Unknown directive: ${directive}`);
	}
	const directiveScriptText = hydrationScripts[directive];
	return directiveScriptText;
}

function getDirectiveScript(result: SSRResult, directive: string): string | Promise<string> {
	if(!result._metadata.clientDirectives.has(directive)) {
		// TODO better error message
		throw new Error(`Unable to find directive ${directive}`);
	}
	let { type, src } = result._metadata.clientDirectives.get(directive)!;
	switch(type) {
		case 'external': {
			return result.resolve(`${src}?astro-client-directive=${directive}`).then(value => {
				return `<script type="module" src="${value}"></script>`;
			});
		}
		case 'inline': {
			throw new Error(`Inline not yet supported`);
		}
	}
}

function isPromise<T>(value: any): value is Promise<T> {
	if(typeof value.then === 'function') {
		return true;
	}
	return false;
}

export function getPrescripts(result: SSRResult, type: PrescriptType, directive: string): string | Promise<string> {
	// Note that this is a classic script, not a module script.
	// This is so that it executes immediate, and when the browser encounters
	// an astro-island element the callbacks will fire immediately, causing the JS
	// deps to be loaded immediately.
	switch (type) {
		case 'both':
			let directiveScript = getDirectiveScript(result, directive);
			if(isPromise<string>(directiveScript)) {
				return directiveScript.then(scriptText => {
					return `${ISLAND_STYLES}${scriptText}<script>${islandScript}</script>`;
				});
			}
			return `${ISLAND_STYLES}${directiveScript}<script>${islandScript}</script>`
		case 'directive':
			return getDirectiveScript(result, directive);
	}
	return '';
}

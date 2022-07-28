import type { SSRResult } from '../../@types/astro';

import idlePrebuilt from '../client/idle.prebuilt.js';
import loadPrebuilt from '../client/load.prebuilt.js';
import mediaPrebuilt from '../client/media.prebuilt.js';
import onlyPrebuilt from '../client/only.prebuilt.js';
import visiblePrebuilt from '../client/visible.prebuilt.js';
import islandScript from './astro-island.prebuilt.js';

export function determineIfNeedsHydrationScript(result: SSRResult): boolean {
	if(result._metadata.hasHydrationScript) {
		return false;
	}
	return result._metadata.hasHydrationScript = true;
}

export const hydrationScripts: Record<string, string> = {
	idle: idlePrebuilt,
	load: loadPrebuilt,
	only: onlyPrebuilt,
	media: mediaPrebuilt,
	visible: visiblePrebuilt,
};

export function determinesIfNeedsDirectiveScript(result: SSRResult, directive: string): boolean {
	if(result._metadata.hasDirectives.has(directive)) {
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

export function getPrescripts(type: PrescriptType, directive: string): string {
	// Note that this is a classic script, not a module script.
	// This is so that it executes immediate, and when the browser encounters
	// an astro-island element the callbacks will fire immediately, causing the JS
	// deps to be loaded immediately.
	switch (type) {
		case 'both':
			return `<style>astro-island,astro-slot{display:contents}</style><script>${
				getDirectiveScriptText(directive) + islandScript
			}</script>`;
		case 'directive':
			return `<script>${getDirectiveScriptText(directive)}</script>`;
	}
	return '';
}

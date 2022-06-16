import type { SSRResult } from '../../@types/astro';

import idlePrebuilt from '../client/idle.prebuilt.js';
import loadPrebuilt from '../client/load.prebuilt.js';
import mediaPrebuilt from '../client/media.prebuilt.js';
import onlyPrebuilt from '../client/only.prebuilt.js';
import visiblePrebuilt from '../client/visible.prebuilt.js';
import islandScript from './astro-island.prebuilt.js';

// This is used to keep track of which requests (pages) have had the hydration script
// appended. We only add the hydration script once per page, and since the SSRResult
// object corresponds to one page request, we are using it as a key to know.
const resultsWithHydrationScript = new WeakSet<SSRResult>();

export function determineIfNeedsHydrationScript(result: SSRResult): boolean {
	if (resultsWithHydrationScript.has(result)) {
		return false;
	}
	resultsWithHydrationScript.add(result);
	return true;
}

export const hydrationScripts: Record<string, string> = {
	idle: idlePrebuilt,
	load: loadPrebuilt,
	only: onlyPrebuilt,
	media: mediaPrebuilt,
	visible: visiblePrebuilt,
};

const resultsWithDirectiveScript = new Map<string, WeakSet<SSRResult>>();

export function determinesIfNeedsDirectiveScript(result: SSRResult, directive: string): boolean {
	if (!resultsWithDirectiveScript.has(directive)) {
		resultsWithDirectiveScript.set(directive, new WeakSet());
	}
	const set = resultsWithDirectiveScript.get(directive)!;
	if (set.has(result)) {
		return false;
	}
	set.add(result);
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
			return `<script>${getDirectiveScriptText(directive) + islandScript}</script>`;
		case 'directive':
			return `<script>${getDirectiveScriptText(directive)}</script>`;
	}
	return '';
}

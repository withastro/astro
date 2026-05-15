import islandScript from './astro-island.prebuilt.js';
import islandScriptDev from './astro-island.prebuilt-dev.js';
import { ISLAND_STYLES } from './astro-island-styles.js';
function determineIfNeedsHydrationScript(result) {
	if (result._metadata.templateDepth > 0) {
		return !result._metadata.hasHydrationScript;
	}
	if (result._metadata.hasHydrationScript) {
		return false;
	}
	return (result._metadata.hasHydrationScript = true);
}
function determinesIfNeedsDirectiveScript(result, directive) {
	if (result._metadata.templateDepth > 0) {
		return !result._metadata.hasDirectives.has(directive);
	}
	if (result._metadata.hasDirectives.has(directive)) {
		return false;
	}
	result._metadata.hasDirectives.add(directive);
	return true;
}
function getDirectiveScriptText(result, directive) {
	const clientDirectives = result.clientDirectives;
	const clientDirective = clientDirectives.get(directive);
	if (!clientDirective) {
		throw new Error(`Unknown directive: ${directive}`);
	}
	return clientDirective;
}
function getPrescripts(result, type, directive) {
	switch (type) {
		case 'both':
			return `<style>${ISLAND_STYLES}</style><script>${getDirectiveScriptText(result, directive)}</script><script>${process.env.NODE_ENV === 'development' ? islandScriptDev : islandScript}</script>`;
		case 'directive':
			return `<script>${getDirectiveScriptText(result, directive)}</script>`;
	}
}
export { determineIfNeedsHydrationScript, determinesIfNeedsDirectiveScript, getPrescripts };

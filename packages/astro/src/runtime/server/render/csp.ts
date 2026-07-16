import { type CspDirectiveSources, partitionByKind } from '../../../core/csp/runtime.js';
import type { SSRResult } from '../../../types/public/index.js';

/** The narrower CSP directives that `script-src`/`style-src` can be split into. */
type SpecificCspDirective =
	| 'script-src-elem'
	| 'script-src-attr'
	| 'style-src-elem'
	| 'style-src-attr';

export function renderCspContent(result: SSRResult): string {
	const { scriptDirective, styleDirective, directives } = result;

	// `kind` is interpreted here (the single partition point): each directive's entries are grouped
	// into the generic `script-src`/`style-src` and the more specific `-elem`/`-attr` variants.
	const script = partitionByKind(scriptDirective);
	const style = partitionByKind(styleDirective);

	// `default`-kind hashes (Astro's generated element hashes + user `default` hashes + render-time
	// generated hashes), quoted once. These are emitted on whichever directive governs elements.
	const finalScriptHashes = new Set<string>();
	for (const scriptHash of script.default.hashes) {
		finalScriptHashes.add(`'${scriptHash}'`);
	}
	for (const scriptHash of result._metadata.extraScriptHashes) {
		finalScriptHashes.add(`'${scriptHash}'`);
	}

	const finalStyleHashes = new Set<string>();
	for (const styleHash of style.default.hashes) {
		finalStyleHashes.add(`'${styleHash}'`);
	}
	for (const styleHash of result._metadata.extraStyleHashes) {
		finalStyleHashes.add(`'${styleHash}'`);
	}

	let directivesContent;
	if (directives.length > 0) {
		directivesContent = directives.join(';') + ';';
	}

	const scriptResources =
		script.default.resources.length > 0 ? script.default.resources.join(' ') : "'self'";
	const styleResources =
		style.default.resources.length > 0 ? style.default.resources.join(' ') : "'self'";
	const scriptElementDefaultResource = script.default.resources.length > 0 ? '' : "'self'";
	const styleElementDefaultResource = style.default.resources.length > 0 ? '' : "'self'";

	// `script-src`/`style-src` cover everything; the `-elem`/`-attr` variants are narrower:
	//   - `*-src-elem` → tags (`<script>`, `<style>`, `<link rel="stylesheet">`)
	//   - `*-src-attr` → inline attributes (`onclick`, `style`)
	// When a narrower directive is present, the browser uses only it for that scope and does not fall
	// back to `script-src`/`style-src`.
	//
	// Default hashes are element-content hashes, so they're emitted on whichever directive governs
	// elements: `script-src-elem`/`style-src-elem` when it's in use, otherwise the baseline
	// `script-src`/`style-src`. They aren't duplicated on the baseline, because the browser never
	// falls back from a narrower directive to it.
	//
	// Default sources, by contrast, stay exactly where they are scoped: a source is a broad,
	// per-scope allowance, so moving or copying it would change the policy intended for another
	// scope. The `-attr` directives receive only what is explicitly scoped to them. `strict-dynamic`
	// from `script-src` also applies to `script-src-elem`. A narrower directive is emitted only when
	// it has its own entries.
	const scriptElemActive = isEnabled(script.element);
	const styleElemActive = isEnabled(style.element);
	const strictDynamicSuffix = scriptDirective.strictDynamic ? ` 'strict-dynamic'` : '';

	// On the baseline, omit the element hashes when the `-elem` directive will carry them instead.
	const scriptBaselineTokens = [
		...(scriptElemActive ? [] : [...finalScriptHashes]),
		...(scriptDirective.strictDynamic ? [`'strict-dynamic'`] : []),
	];
	const scriptSrc = `script-src ${scriptResources} ${scriptBaselineTokens.join(' ')};`;
	const styleSrc = `style-src ${styleResources} ${(styleElemActive ? [] : [...finalStyleHashes]).join(' ')};`;

	const scriptSrcElem = scriptElemActive
		? renderSpecificDirective(
				'script-src-elem',
				script.element.resources,
				scriptElementDefaultResource,
				finalScriptHashes,
				script.element.hashes,
				strictDynamicSuffix,
			)
		: undefined;
	const scriptSrcAttr = isEnabled(script.attribute)
		? renderSpecificDirective(
				'script-src-attr',
				script.attribute.resources,
				"'none'",
				undefined,
				script.attribute.hashes,
			)
		: undefined;
	const styleSrcElem = styleElemActive
		? renderSpecificDirective(
				'style-src-elem',
				style.element.resources,
				styleElementDefaultResource,
				finalStyleHashes,
				style.element.hashes,
			)
		: undefined;
	const styleSrcAttr = isEnabled(style.attribute)
		? renderSpecificDirective(
				'style-src-attr',
				style.attribute.resources,
				"'none'",
				undefined,
				style.attribute.hashes,
			)
		: undefined;

	return [
		directivesContent,
		scriptSrc,
		scriptSrcElem,
		scriptSrcAttr,
		styleSrc,
		styleSrcElem,
		styleSrcAttr,
	]
		.filter(Boolean)
		.join(' ');
}

/** A more specific directive is emitted only when the user scoped at least one source/hash to it. */
function isEnabled(sources: CspDirectiveSources): boolean {
	return sources.resources.length > 0 || sources.hashes.length > 0;
}

/**
 * Builds one of the narrower directive strings: `script-src-elem`, `script-src-attr`,
 * `style-src-elem`, or `style-src-attr`.
 *
 * @param name The directive name, e.g. `"script-src-elem"`.
 * @param resources The sources the user scoped to this directive (e.g. `'self'` or a URL).
 * @param defaultResource The source to use when `resources` is empty. This is `'self'` for `-elem` without configured default resources and `'none'` for `-attr`.
 * @param sharedHashes Already-quoted hashes to also include here — Astro's tag hashes for `-elem`, or `undefined` for `-attr` (which never receives them).
 * @param ownHashes Unquoted hashes the user scoped to this directive.
 * @param suffix Optional text added at the end, e.g. ` 'strict-dynamic'`.
 */
function renderSpecificDirective(
	name: SpecificCspDirective,
	resources: string[],
	defaultResource: string,
	sharedHashes: Set<string> | undefined,
	ownHashes: string[],
	suffix = '',
): string {
	const hashes = new Set<string>(sharedHashes);
	for (const hash of ownHashes) {
		hashes.add(`'${hash}'`);
	}
	let finalResources: string;
	if (resources.length > 0) {
		finalResources = resources.map((r) => `${r}`).join(' ');
	} else if (defaultResource === "'none'" && hashes.size > 0) {
		// `'none'` cannot coexist with other sources; if hashes were provided, emit only the hashes.
		finalResources = '';
	} else {
		finalResources = defaultResource;
	}
	return `${name} ${[finalResources, ...hashes].filter(Boolean).join(' ')}${suffix};`;
}

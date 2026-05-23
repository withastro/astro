import type { AstroConfig, AstroUserConfig } from '../../types/public/config.js';
import { errorMap } from '../errors/index.js';
import { AstroConfigRefinedSchema, createRelativeSchema } from './schemas/index.js';

/** Turn raw config values into normalized values */
export async function validateConfig(
	userConfig: any,
	root: string,
	cmd: string,
): Promise<AstroConfig> {
	const AstroConfigRelativeSchema = createRelativeSchema(cmd, root);

	await coerceLegacyMarkdownPlugins(userConfig);
	warnDeprecatedMarkdownOptions(userConfig);

	// First-Pass Validation
	return await validateConfigRefined(
		await AstroConfigRelativeSchema.parseAsync(userConfig, {
			error(issue) {
				// If an experimental feature, give a more specific error message.
				if (issue.path?.[0] === 'experimental') {
					return {
						message: `Invalid or outdated experimental feature.\nCheck for incorrect spelling or outdated Astro version.\nSee https://docs.astro.build/en/reference/experimental-flags/ for a list of all current experiments.`,
					};
				}
				return errorMap(issue);
			},
		}),
	);
}

let didWarnAboutDeprecatedMarkdownOptions = false;

function warnDeprecatedMarkdownOptions(
	config: Pick<AstroUserConfig, 'markdown'> | undefined,
): void {
	if (didWarnAboutDeprecatedMarkdownOptions) return;
	const md = config?.markdown;
	if (!md) return;
	const deprecated = (['gfm', 'smartypants'] as const).filter((k) => md[k] !== undefined);
	if (deprecated.length === 0) return;
	didWarnAboutDeprecatedMarkdownOptions = true;

	const names = deprecated.map((key) => `\`markdown.${key}\``).join(' and ');
	const isPlural = deprecated.length > 1;
	console.warn(
		`[astro] ${names} ${isPlural ? 'are' : 'is'} deprecated. Move ${isPlural ? 'them' : 'it'} onto your processor instead (e.g. \`satteri({ features: { gfm: false, smartPunctuation: false } })\` or \`unified({ gfm: false, smartypants: false })\` after installing \`@astrojs/markdown-remark\`). Will be removed in a future major.`,
	);
}

let didWarnAboutLegacyMarkdownPlugins = false;
let didWarnAboutProcessorSwap = false;

/**
 * Folds legacy `markdown.{remark,rehype}Plugins` / `remarkRehype` into the unified
 * processor descriptor and clears the legacy keys. Mutates `config` in place.
 * Runs on every validate pass so integration-added legacy plugins are picked up.
 * Without this they'd land in `config.markdown.*` and be silently dropped.
 */
async function coerceLegacyMarkdownPlugins(
	config: Pick<AstroUserConfig, 'markdown'>,
): Promise<void> {
	const md = config?.markdown;
	if (!md) return;

	const remarkPlugins = md.remarkPlugins ?? [];
	const rehypePlugins = md.rehypePlugins ?? [];
	const remarkRehype = md.remarkRehype ?? {};
	if (
		remarkPlugins.length === 0 &&
		rehypePlugins.length === 0 &&
		Object.keys(remarkRehype).length === 0
	) {
		return;
	}

	let unified: typeof import('@astrojs/markdown-remark').unified;
	let isUnifiedProcessor: typeof import('@astrojs/markdown-remark').isUnifiedProcessor;
	try {
		({ unified, isUnifiedProcessor } = await import('@astrojs/markdown-remark'));
	} catch {
		throw new Error(
			'`markdown.remarkPlugins`, `markdown.rehypePlugins`, and `markdown.remarkRehype` require `@astrojs/markdown-remark`. Install it with:\n  npm install @astrojs/markdown-remark',
		);
	}

	const current = md.processor;
	if (current && isUnifiedProcessor(current)) {
		// `createRenderer` reads `.options.*` at render time, so in-place mutation propagates.
		current.options.remarkPlugins.push(...remarkPlugins);
		current.options.rehypePlugins.push(...rehypePlugins);
		Object.assign(current.options.remarkRehype, remarkRehype);
		if (!didWarnAboutLegacyMarkdownPlugins) {
			didWarnAboutLegacyMarkdownPlugins = true;
			console.warn(
				'[astro] `markdown.remarkPlugins`, `markdown.rehypePlugins`, and `markdown.remarkRehype` are deprecated. Pass them to `unified({...})` from `@astrojs/markdown-remark` directly instead.',
			);
		}
	} else {
		// The default processor (Sätteri) and other third-party processors can't run remark/rehype
		// plugins, so legacy plugins force a swap to `unified()`. Warn loudly — this changes the
		// active Markdown processor away from the default native pipeline.
		if (!didWarnAboutProcessorSwap) {
			didWarnAboutProcessorSwap = true;
			const replaced = current?.name ?? 'satteri';
			console.warn(
				`[astro] Found deprecated \`markdown.remarkPlugins\`/\`rehypePlugins\`/\`remarkRehype\`, so the ` +
					`Markdown processor was switched from \`${replaced}\`` +
					`${replaced === 'satteri' ? ' (the default native pipeline)' : ''} to \`unified\`. ` +
					`To keep \`${replaced}\`, remove those options; to silence this warning, set ` +
					'`markdown.processor: unified({...})` from `@astrojs/markdown-remark` explicitly.',
			);
		}
		md.processor = unified({ remarkPlugins, rehypePlugins, remarkRehype });
	}

	delete md.remarkPlugins;
	delete md.rehypePlugins;
	delete md.remarkRehype;
}

/**
 * Used twice:
 * - To validate the user config
 * - To validate the config after all integrations (that may have updated it)
 */
export async function validateConfigRefined(updatedConfig: AstroConfig): Promise<AstroConfig> {
	await coerceLegacyMarkdownPlugins(updatedConfig);
	warnDeprecatedMarkdownOptions(updatedConfig);
	return await AstroConfigRefinedSchema.parseAsync(updatedConfig, { error: errorMap });
}

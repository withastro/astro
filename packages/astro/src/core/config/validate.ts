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
		`[astro] ${names} ${isPlural ? 'are' : 'is'} deprecated. Move ${isPlural ? 'them' : 'it'} onto your processor instead (e.g. \`unified({ gfm: false, smartypants: false })\`). Will be removed in a future major.`,
	);
}

let didWarnAboutLegacyMarkdownPlugins = false;
let didWarnAboutProcessorMismatch = false;

/**
 * Folds legacy `markdown.{remark,rehype}Plugins` / `remarkRehype` into the unified
 * processor and clears the legacy keys. Mutates `config` in place.
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

	const { unified, isUnifiedProcessor } = await import('@astrojs/markdown-remark');

	const current = md.processor;
	if (!current || isUnifiedProcessor(current)) {
		// `createRenderer` reads `.options.*` at render time, so in-place mutation propagates.
		const target = (current ?? (md.processor = unified())) as ReturnType<typeof unified>;
		target.options.remarkPlugins.push(...remarkPlugins);
		target.options.rehypePlugins.push(...rehypePlugins);
		Object.assign(target.options.remarkRehype, remarkRehype);
		if (!didWarnAboutLegacyMarkdownPlugins) {
			didWarnAboutLegacyMarkdownPlugins = true;
			console.warn(
				'[astro] `markdown.remarkPlugins`, `markdown.rehypePlugins`, and `markdown.remarkRehype` are deprecated. Pass them to `unified({...})` from `@astrojs/markdown-remark` directly instead.',
			);
		}
		delete md.remarkPlugins;
		delete md.rehypePlugins;
		delete md.remarkRehype;
	} else if (!didWarnAboutProcessorMismatch) {
		// Third-party processors can't run remark/rehype plugins. We *don't* swap the
		// user's chosen processor — that would silently flip their Markdown engine.
		// Instead, leave the legacy keys in place (so other tooling can still see them)
		// and warn loudly: the plugins won't run until they move to `unified()`.
		didWarnAboutProcessorMismatch = true;
		console.warn(
			`[astro] \`markdown.remarkPlugins\`/\`rehypePlugins\`/\`remarkRehype\` are set, but your ` +
				`\`${current.name}\` processor doesn't run them. Move them to \`unified({...})\` from ` +
				'`@astrojs/markdown-remark` and set `markdown.processor: unified({...})` if you want ' +
				'them to apply.',
		);
	}
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

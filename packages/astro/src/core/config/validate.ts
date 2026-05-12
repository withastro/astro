import type { AstroConfig } from '../../types/public/config.js';
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

/**
 * Wraps legacy `markdown.{remark,rehype}Plugins` / `remarkRehype` into a
 * `unified({...})` processor (with a warning). Mutates `userConfig` in place.
 */
async function coerceLegacyMarkdownPlugins(userConfig: any): Promise<void> {
	const md = userConfig?.markdown;
	if (!md || typeof md !== 'object' || Array.isArray(md)) return;
	if (md.processor) return;

	const hasRemarkPlugins = Array.isArray(md.remarkPlugins) && md.remarkPlugins.length > 0;
	const hasRehypePlugins = Array.isArray(md.rehypePlugins) && md.rehypePlugins.length > 0;
	const hasRemarkRehype =
		md.remarkRehype &&
		typeof md.remarkRehype === 'object' &&
		!Array.isArray(md.remarkRehype) &&
		Object.keys(md.remarkRehype).length > 0;
	if (!hasRemarkPlugins && !hasRehypePlugins && !hasRemarkRehype) return;

	let unified: typeof import('@astrojs/markdown-remark').unified;
	try {
		({ unified } = await import('@astrojs/markdown-remark'));
	} catch {
		throw new Error(
			'`markdown.remarkPlugins`, `markdown.rehypePlugins`, and `markdown.remarkRehype` require `@astrojs/markdown-remark`. Install it with:\n  pnpm add @astrojs/markdown-remark\n\nThen migrate to the new processor API:\n  import { unified } from \'@astrojs/markdown-remark\';\n  markdown: { processor: unified({ remarkPlugins: [...] }) }',
		);
	}

	console.warn(
		'[astro] `markdown.remarkPlugins`, `markdown.rehypePlugins`, and `markdown.remarkRehype` are deprecated. Use `markdown.processor: unified({...})` from `@astrojs/markdown-remark` instead.',
	);
	md.processor = unified({
		remarkPlugins: md.remarkPlugins ?? [],
		rehypePlugins: md.rehypePlugins ?? [],
		remarkRehype: md.remarkRehype ?? {},
	});
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
	return await AstroConfigRefinedSchema.parseAsync(updatedConfig, { error: errorMap });
}

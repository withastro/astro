import type { SSRResult } from 'astro';
import {
	type AstroComponentFactory,
	createComponent,
	createHeadAndContent,
	renderComponent,
	renderScriptElement,
	renderTemplate,
	renderUniqueStylesheet,
	unescapeHTML,
} from '../runtime/server/index.js';
import { isRemotePath, prependForwardSlash } from '../core/path.js';

/**
 * A lazy import of an Astro component marked with the `?assets` query.
 *
 * `dynamic()` reads the component's styles and links from the propagated-assets
 * module the query produces, so only the components that actually render add
 * their assets to the page.
 */
export type DynamicComponentLoader = () => Promise<PropagatedAssetsModule>;

interface PropagatedAssetsModule {
	default: {
		__astroPropagation?: boolean;
		getMod: () => Promise<{ default: AstroComponentFactory }>;
		collectedStyles?: Array<string | { id?: string; content: string }>;
		collectedLinks?: string[];
		collectedScripts?: unknown[];
	};
}

/**
 * Tracks the components whose assets have already been added to a page, so a
 * component rendered more than once does not add its styles twice.
 */
const addedToPage = new WeakMap<SSRResult, WeakSet<AstroComponentFactory>>();

/**
 * Resolves a lazily imported component and returns a component factory that
 * adds its assets to the page when it renders.
 *
 * Import the candidate components with the `?assets` query, then await the
 * loader once in the page frontmatter:
 *
 * ```astro
 * ---
 * import { dynamic } from 'astro:dynamic';
 *
 * const loaders = {
 *   hero: () => import('../components/Hero.astro?assets'),
 *   cards: () => import('../components/Cards.astro?assets'),
 * };
 *
 * const Render = await dynamic(loaders[view.component]);
 * ---
 * <Render initial={view.initial} />
 * ```
 *
 * @param loader - A function that dynamically imports the component with the `?assets` query.
 * @returns A promise that resolves to the component factory.
 */
export async function dynamic(loader: DynamicComponentLoader): Promise<AstroComponentFactory> {
	const entry = await loader();
	const propagated = entry?.default;
	if (!propagated || typeof propagated.__astroPropagation !== 'boolean') {
		throw new Error(
			'`dynamic()` expects a component imported with the `?assets` query, for example `() => import("./Counter.astro?assets")`.',
		);
	}
	if (typeof propagated.getMod !== 'function') {
		throw new Error('The `?assets` module did not provide a `getMod` function.');
	}

	const { collectedStyles, collectedLinks, collectedScripts, getMod } = propagated;
	const componentModule = await getMod();
	const component = componentModule.default;
	if (typeof component !== 'function') {
		throw new Error('The `?assets` query did not resolve to an Astro component.');
	}

	return createComponent({
		factory(result, props, slots) {
			const content = renderTemplate`${renderComponent(
				result,
				'Dynamic',
				component,
				props,
				slots,
			)}`;

			if (addedToPage.get(result)?.has(component)) {
				return createHeadAndContent('', content);
			}
			const added = addedToPage.get(result) ?? addedToPage.set(result, new WeakSet()).get(result)!;
			added.add(component);

			const styles = (collectedStyles ?? [])
				.map((style) => {
					const styleContent = typeof style === 'string' ? style : style.content;
					const viteDevId = typeof style === 'object' && style.id ? style.id : undefined;
					return renderUniqueStylesheet(result, {
						type: 'inline',
						content: styleContent,
						viteDevId,
					});
				})
				.join('');
			const links = (collectedLinks ?? [])
				.map((link) =>
					renderUniqueStylesheet(result, {
						type: 'external',
						src: isRemotePath(link) ? link : prependForwardSlash(link),
					}),
				)
				.join('');
			const scripts = (collectedScripts ?? [])
				.map((script) => renderScriptElement(script as any))
				.join('');

			return createHeadAndContent(unescapeHTML(styles + links + scripts) as any, content);
		},
		propagation: 'self',
	});
}

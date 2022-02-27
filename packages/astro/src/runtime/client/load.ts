import type { GetHydrateCallback, HydrateOptions } from '../../@types/astro';

/**
 * Hydrate this component immediately
 */
export default async function onLoad(astroId: string, options: HydrateOptions, getHydrateCallback: GetHydrateCallback) {
	async function load() {
		const roots = document.querySelectorAll(`astro-root[ssr][uid="${astroId}"]`);
		if (roots.length === 0) return;

		let innerHTML: string | null = null;
		let fragment = roots[0].querySelector(`astro-fragment`);
		if (fragment == null && roots[0].hasAttribute('tmpl')) {
			// If there is no child fragment, check to see if there is a template.
			// This happens if children were passed but the client component did not render any.
			let template = roots[0].querySelector(`template[data-astro-template]`);
			if (template) {
				innerHTML = template.innerHTML;
				template.remove();
			}
		} else if (fragment) {
			innerHTML = fragment.innerHTML;
		}

		const hydrate = await getHydrateCallback();
		for (const root of roots) {
			hydrate(root, innerHTML);
			root.removeAttribute('ssr');
		}
		window.addEventListener('astro:locationchange', load, { once: true })
	}

	load();
}

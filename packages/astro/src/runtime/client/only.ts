import type { GetHydrateCallback, HydrateOptions } from '../../@types/astro';

/**
 * Hydrate this component only on the client
 */
export default async function onOnly(
	astroId: string,
	options: HydrateOptions,
	getHydrateCallback: GetHydrateCallback
) {
	let innerHTML: string | null = null;
	async function only() {
		window.addEventListener('astro:hydrate', only, { once: true })
		const roots = document.querySelectorAll(`astro-root[ssr][uid="${astroId}"]`);
		if (roots.length === 0) return;

		if (typeof innerHTML !== 'string') {
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
		}
		const hydrate = await getHydrateCallback();

		for (const root of roots) {
			hydrate(root, innerHTML);
			root.removeAttribute('ssr');
		}
	}
	only()
}

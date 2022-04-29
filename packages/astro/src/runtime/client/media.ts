import type { GetHydrateCallback, HydrateOptions } from '../../@types/astro';

/**
 * Hydrate this component when a matching media query is found
 */
export default async function onMedia(
	root: HTMLElement,
	options: HydrateOptions,
	getHydrateCallback: GetHydrateCallback
) {
	let innerHTML: string | null = null;
	let fragment = root.querySelector(`astro-fragment`);
	if (fragment == null && root.hasAttribute('tmpl')) {
		// If there is no child fragment, check to see if there is a template.
		// This happens if children were passed but the client component did not render any.
		let template = root.querySelector(`template[data-astro-template]`);
		if (template) {
			innerHTML = template.innerHTML;
			template.remove();
		}
	} else if (fragment) {
		innerHTML = fragment.innerHTML;
	}

	const cb = async () => {
		const hydrate = await getHydrateCallback();
		hydrate(root, innerHTML);
	};

	if (options.value) {
		const mql = matchMedia(options.value);
		if (mql.matches) {
			cb();
		} else {
			mql.addEventListener('change', cb, { once: true });
		}
	}
}

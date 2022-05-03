import type { GetHydrateCallback, HydrateOptions } from '../../@types/astro';

/**
 * Hydrate this component as soon as the main thread is free
 * (or after a short delay, if `requestIdleCallback`) isn't supported
 */
export default async function onIdle(
	root: HTMLElement,
	options: HydrateOptions,
	getHydrateCallback: GetHydrateCallback
) {
	const cb = async () => {
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
		const hydrate = await getHydrateCallback();
		hydrate(root, innerHTML);
	};

	if ('requestIdleCallback' in window) {
		(window as any).requestIdleCallback(cb);
	} else {
		setTimeout(cb, 200);
	}
}

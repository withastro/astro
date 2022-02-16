import type { GetHydrateCallback, HydrateOptions } from '../../@types/astro';

/**
 * Hydrate this component when one of it's children becomes visible.
 * We target the children because `astro-root` is set to `display: contents`
 * which doesn't work with IntersectionObserver
 */
export default async function onVisible(astroId: string, options: HydrateOptions, getHydrateCallback: GetHydrateCallback) {
	const roots = document.querySelectorAll(`astro-root[uid="${astroId}"]`);
	if(roots.length === 0) {
		throw new Error(`Unable to find the root for the component ${options.name}`);
	}

	let innerHTML: string | null = null;
	let fragment = roots[0].querySelector(`astro-fragment`);
	if(fragment == null && roots[0].hasAttribute('tmpl')) {
		// If there is no child fragment, check to see if there is a template.
		// This happens if children were passed but the client component did not render any.
		let template = roots[0].querySelector(`template[data-astro-template]`);
		if(template) {
			innerHTML = template.innerHTML;
			template.remove();
		}
	} else if(fragment) {
		innerHTML = fragment.innerHTML;
	}

	const cb = async () => {
		const hydrate = await getHydrateCallback();
		for (const root of roots) {
			hydrate(root, innerHTML);
		}
	};

	const io = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			if (!entry.isIntersecting) continue;
			// As soon as we hydrate, disconnect this IntersectionObserver for every `astro-root`
			io.disconnect();
			cb();
			break; // break loop on first match
		}
	});

	for (const root of roots) {
		for (let i = 0; i < root.children.length; i++) {
			const child = root.children[i];
			io.observe(child);
		}
	}
}

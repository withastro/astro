import type { GetHydrateCallback, HydrateOptions } from '../../@types/hydrate';

/**
 * Hydrate this component when a matching media query is found
 */
export default async function onMedia(astroId: string, options: HydrateOptions, getHydrateCallback: GetHydrateCallback) {
  const roots = document.querySelectorAll(`astro-root[uid="${astroId}"]`);
  const innerHTML = roots[0].querySelector(`astro-fragment`)?.innerHTML ?? null;

  const cb = async () => {
    const hydrate = await getHydrateCallback();
    for (const root of roots) {
      hydrate(root, innerHTML);
    }
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

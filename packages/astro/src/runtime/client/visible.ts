import type { GetHydrateCallback, HydrateOptions } from '../../@types/astro';

/**
 * Hydrate this component when one of it's children becomes visible.
 * We target the children because `astro-root` is set to `display: contents`
 * which doesn't work with IntersectionObserver
 */
export default async function onVisible(astroId: string, _options: HydrateOptions, getHydrateCallback: GetHydrateCallback) {
  const roots = document.querySelectorAll(`astro-root[uid="${astroId}"]`);
  const innerHTML = roots[0].querySelector(`astro-fragment`)?.innerHTML ?? null;

  const cb = async () => {
    const hydrate = await getHydrateCallback();
    for (const root of roots) {
      hydrate(root, innerHTML);
    }
  };

  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    // As soon as we hydrate, disconnect this IntersectionObserver for every `astro-root`
    io.disconnect();
    cb();
  });

  for (const root of roots) {
    for (let i = 0; i < root.children.length; i++) {
      const child = root.children[i];
      io.observe(child);
    }
  }
}

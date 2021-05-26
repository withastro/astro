import type { GetHydrateCallback } from '../../@types/hydrate';

/**
 * Hydrate this component as soon as the main thread is free
 * (or after a short delay, if `requestIdleCallback`) isn't supported
 */
export default async function onIdle(astroId: string, getHydrateCallback: GetHydrateCallback) {
  const cb = async () => {
    const roots = document.querySelectorAll(`astro-root[uid="${astroId}"]`);
    const innerHTML = roots[0].querySelector(`astro-fragment`)?.innerHTML ?? null;
    const hydrate = await getHydrateCallback();

    for (const root of roots) {
      hydrate(root, innerHTML);
    }
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(cb);
  } else {
    setTimeout(cb, 200);
  }
}

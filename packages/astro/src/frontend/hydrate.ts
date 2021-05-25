type GetHydrateCallback = () => Promise<(element: Element, innerHTML: string|null) => void>;
type AstroSetupInfo = ReturnType<typeof setupAstro>;

/** 
  * For a given `astroId`, find every matching `astro-root` element.
  *
  * We'll also check the first match for an `astro-fragment` element
  * and grab the `innerHTML` if we find it. We use this HTML string
  * to pass the correct `children` back to the renderer.
  *
  * Note that every matching `astro-root` will have the same `innerHTML`
  * because `astroId` is a hash based on the generated HTML.
  */
const setupAstro = (astroId: string) => {
  const roots = document.querySelectorAll(`astro-root[uid="${astroId}"]`);
  let innerHTML = null;
  let children = roots[0].querySelector(`astro-fragment`);
  if (children) innerHTML = children.innerHTML;
  return { roots, innerHTML };
}

/** 
  * Execute hydration on every matching `astro-root` element.
  * This is a shared utility for all hydration methods to run.
  */
const doHydrate = async ({ roots, innerHTML }: AstroSetupInfo, getHydrateCallback: GetHydrateCallback) => {
  const hydrate = await getHydrateCallback();
  for (const root of roots) {
    hydrate(root, innerHTML);
  }
}

/**
 * Hydrate this component immediately
 */
export const onLoad = async (astroId: string, getHydrateCallback: GetHydrateCallback) => {
  doHydrate(setupAstro(astroId), getHydrateCallback);
}

/**
 * Hydrate this component as soon as the main thread is free 
 * (or after a short delay, if `requestIdleCallback`) isn't supported
 */
export const onIdle = (astroId: string, getHydrateCallback: GetHydrateCallback) => {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => doHydrate(setupAstro(astroId), getHydrateCallback))
  } else {
    setTimeout(() => doHydrate(setupAstro(astroId), getHydrateCallback), 200)
  }
}

/**
 * Hydrate this component when one of it's children becomes visible.
 * We target the children because `astro-root` is set to `display: contents`
 * which doesn't work with IntersectionObserver
 */
export const onVisible = async (astroId: string, getHydrateCallback: GetHydrateCallback) => {
  const context = setupAstro(astroId);
  const io = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    // As soon as we hydrate, disconnect this IntersectionObserver for every `astro-root`
    io.disconnect();
    doHydrate(context, getHydrateCallback);
  });

  for (const root of context.roots) {
    for (let i = 0; i < root.children.length; i++) {
      const child = root.children[i];
      io.observe(child);
    }
  }
}

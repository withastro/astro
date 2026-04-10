// A .ts file that default-imports .astro components — the same pattern
// used by @storyblok/astro's virtual:import-storyblok-components.
//
// During esbuild dep scanning, these .astro imports land in the "html"
// namespace. Without `namespace: "file"` on the astro-frontmatter-scan
// onLoad handler, the plugin intercepts the load and returns only the
// frontmatter — which has no `export default` — breaking the import with
// `No matching export in "html:..." for import "default"`. Regression
// guard for #16203.
import Inner from '../components/Inner.astro';
import Outer from '../components/Outer.astro';

export const components = { Inner, Outer };

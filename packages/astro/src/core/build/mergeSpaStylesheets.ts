import type {SerializedSSRManifest} from "../app/types.js";

export function mergeSpaStylesheets(manifest: SerializedSSRManifest) {
  // TODO: optimise this, as a lot of duplicate CSS may be sent.
  const indexedStyles = manifest.routes.map((r, i) => ({
    styles: r.styles,
    i,
  }));
  const routes = Object.values(manifest.routes);
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    for (const styles of indexedStyles) {
      if (i == styles.i) {
        // Skip duplicating styles from origin route.
        continue;
      }
      route.styles.push(...styles.styles);
    }
  }
}

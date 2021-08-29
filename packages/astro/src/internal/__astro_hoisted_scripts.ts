import type { ScriptInfo } from '../@types/astro';

const sym = Symbol.for('astro.hoistedScripts');

interface ComponentThatMaybeHasHoistedScripts {
  [sym]: ScriptInfo[];
}

/**
 * Takes all of the components this component uses and combines them with its
 * own scripts and flattens it to a deduped list.
 * The page component will have an array of all scripts used by all child components and itself.
 */
function hoistedScripts(Components: ComponentThatMaybeHasHoistedScripts[], scripts: ScriptInfo[]) {
  const flatScripts = [];

  const allScripts: ScriptInfo[] = Components.map((c) => c && c[sym])
    .filter((a) => a)
    .concat(scripts)
    .flatMap((a) => a);

  const visitedSource = new Set();
  for (let script of allScripts) {
    if (!('src' in script)) {
      flatScripts.push(script);
    } else if (!visitedSource.has(script.src)) {
      flatScripts.push(script);
      visitedSource.add(script.src);
    }
  }

  return flatScripts;
}

export { hoistedScripts as __astro_hoisted_scripts };

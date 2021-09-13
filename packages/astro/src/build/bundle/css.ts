import type { AstroConfig, BuildOutput, BundleMap } from '../../@types/astro';
import type { LogOptions } from '../../logger.js';

import { performance } from 'perf_hooks';
import shorthash from 'shorthash';
import cheerio from 'cheerio';
import esbuild from 'esbuild';
import { getDistPath, getSrcPath, IS_ASTRO_FILE_URL, stopTimer } from '../util.js';
import { debug } from '../../logger.js';

// config
const COMMON_URL = `/_astro/common-[HASH].css`; // [HASH] will be replaced

/**
 * Bundle CSS
 * For files within dep tree, find ways to combine them.
 * Current logic:
 *   - If CSS appears across multiple pages, combine into `/_astro/common.css` bundle
 *   - Otherwise, combine page CSS into one request as `/_astro/[page].css` bundle
 *
 * This operation _should_ be relatively-safe to do in parallel with other bundling,
 * assuming other bundling steps don’t touch CSS. While this step does modify HTML,
 * it doesn’t keep anything in local memory so other processes may modify HTML too.
 *
 * This operation mutates the original references of the buildOutput not only for
 * safety (prevents possible conflicts), but for efficiency.
 */
export async function bundleCSS({
  astroConfig,
  buildState,
  logging,
  depTree,
}: {
  astroConfig: AstroConfig;
  buildState: BuildOutput;
  logging: LogOptions;
  depTree: BundleMap;
}): Promise<void> {
  const timer: Record<string, number> = {};
  const cssMap = new Map<string, string>();

  // 1. organize CSS into common or page-specific CSS
  timer.bundle = performance.now();
  const sortedPages = Object.keys(depTree); // these were scanned in parallel; sort to create somewhat deterministic order
  sortedPages.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  for (const pageUrl of sortedPages) {
    const { css } = depTree[pageUrl];
    for (const cssUrl of css.keys()) {
      if (!IS_ASTRO_FILE_URL.test(cssUrl)) {
        // do not add to cssMap, leave as-is.
      } else if (cssMap.has(cssUrl)) {
        // scenario 1: if multiple URLs require this CSS, upgrade to common chunk
        cssMap.set(cssUrl, COMMON_URL);
      } else {
        // scenario 2: otherwise, assume this CSS is page-specific
        cssMap.set(cssUrl, '/_astro' + pageUrl.replace(/.html$/, '').replace(/^\./, '') + '-[HASH].css');
      }
    }
  }

  // 2. bundle (note: assume cssMap keys are in specific, correct order; assume buildState[] keys are in different order each time)
  timer.bundle = performance.now();
  // note: don’t parallelize here otherwise CSS may end up in random order
  for (const id of cssMap.keys()) {
    const newUrl = cssMap.get(id) as string;

    // if new bundle, create
    if (!buildState[newUrl]) {
      buildState[newUrl] = {
        srcPath: getSrcPath(id, { astroConfig }), // this isn’t accurate, but we can at least reference a file in the bundle
        contents: '',
        contentType: 'text/css',
        encoding: 'utf8',
      };
    }

    // append to bundle, delete old file
    (buildState[newUrl] as any).contents += Buffer.isBuffer(buildState[id].contents) ? buildState[id].contents.toString('utf8') : buildState[id].contents;
    delete buildState[id];
  }
  debug(logging, 'css', `bundled [${stopTimer(timer.bundle)}]`);

  // 3. minify
  timer.minify = performance.now();
  await Promise.all(
    Object.keys(buildState).map(async (id) => {
      if (buildState[id].contentType !== 'text/css') return;
      const { code } = await esbuild.transform(buildState[id].contents.toString(), {
        loader: 'css',
        minify: true,
      });
      buildState[id].contents = code;
    })
  );
  debug(logging, 'css', `minified [${stopTimer(timer.minify)}]`);

  // 4. determine hashes based on CSS content (deterministic), and update HTML <link> tags with final hashed URLs
  timer.hashes = performance.now();
  const cssHashes = new Map<string, string>();
  for (const id of Object.keys(buildState)) {
    if (!id.includes('[HASH].css')) continue; // iterate through buildState, looking to replace [HASH]

    const hash = shorthash.unique(buildState[id].contents as string);
    const newID = id.replace(/\[HASH\]/, hash);
    cssHashes.set(id, newID);
    buildState[newID] = buildState[id]; // copy ref without cloning to save memory
    delete buildState[id]; // delete old ref
  }
  debug(logging, 'css', `built hashes [${stopTimer(timer.hashes)}]`);

  // 5. update HTML <link> tags with final hashed URLs
  timer.html = performance.now();
  await Promise.all(
    Object.keys(buildState).map(async (id) => {
      if (buildState[id].contentType !== 'text/html') return;

      const $ = cheerio.load(buildState[id].contents);
      const stylesheets = new Set<string>(); // keep track of page-specific CSS so we remove dupes
      const preloads = new Set<string>(); // list of stylesheets preloads, to remove dupes

      $('link[href]').each((i, el) => {
        const srcPath = getSrcPath(id, { astroConfig });
        const oldHref = getDistPath($(el).attr('href') || '', { astroConfig, srcPath }); // note: this may be a relative URL; transform to absolute to find a buildOutput match
        const newHref = cssMap.get(oldHref);

        if (!newHref) {
          return;
        }

        if (el.attribs?.rel === 'preload') {
          if (preloads.has(newHref)) {
            $(el).remove();
          } else {
            $(el).attr('href', cssHashes.get(newHref) || '');
            preloads.add(newHref);
          }
          return;
        }

        if (stylesheets.has(newHref)) {
          $(el).remove(); // this is a dupe; remove
        } else {
          $(el).attr('href', cssHashes.get(newHref) || ''); // new CSS; update href (important! use cssHashes, not cssMap)

          // bonus: add [rel] and [type]. not necessary, but why not?
          $(el).attr('rel', 'stylesheet');
          $(el).attr('type', 'text/css');

          stylesheets.add(newHref);
        }
      });
      (buildState[id] as any).contents = $.html(); // save updated HTML in global buildState
    })
  );
  debug(logging, 'css', `parsed html [${stopTimer(timer.html)}]`);
}

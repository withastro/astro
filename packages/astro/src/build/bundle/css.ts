import type { BuildOutput, BundleMap } from '../../@types/astro';

import path from 'path';
import shorthash from 'shorthash';
import cheerio from 'cheerio';
import esbuild from 'esbuild';
import { absoluteURL } from '../util.js';

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
export async function bundleCSS({ buildState, depTree }: { buildState: BuildOutput; depTree: BundleMap }): Promise<void> {
  const cssMap = new Map<string, string>();

  // 1. identify common CSS vs page-specific CSS
  for (const [pageUrl, { css }] of Object.entries(depTree)) {
    for (const cssUrl of css.keys()) {
      if (cssMap.has(cssUrl)) {
        // scenario 1: if multiple URLs require this CSS, upgrade to common chunk
        cssMap.set(cssUrl, COMMON_URL);
      } else {
        // scenario 2: otherwise, assume this CSS is page-specific
        cssMap.set(cssUrl, '/_astro' + pageUrl.replace(/.html$/, '').replace(/^\./, '') + '-[HASH].css');
      }
    }
  }

  // 2. bundle CSS
  await Promise.all(
    Object.entries(buildState).map(async ([id, buildResult]) => {
      if (buildResult.contentType !== 'text/css') return;

      const newUrl = cssMap.get(id);
      if (!newUrl) return;

      // if new bundle, create
      if (!buildState[newUrl]) {
        buildState[newUrl] = {
          srcPath: id, // this isn’t accurate, but we can at least reference a file in the bundle
          contents: '',
          contentType: 'text/css',
          encoding: 'utf8',
        };
      }

      // append to bundle, delete old file
      (buildState[newUrl] as any).contents += buildResult.contents;
      delete buildState[id];
    })
  );

  // 3. minify all CSS
  await Promise.all(
    Object.entries(buildState).map(async ([id, buildResult]) => {
      if (buildResult.contentType !== 'text/css') return;
      const { code } = await esbuild.transform(buildResult.contents as string, {
        loader: 'css',
        minify: true,
      });
      buildResult.contents = code;
    })
  );

  // 4. determine hashes based on CSS content (deterministic), and update HTML <link> tags with final hashed URLs
  const cssHashes = new Map<string, string>();
  for (const [id, buildResult] of Object.entries(buildState)) {
    if (!id.includes('[HASH].css')) continue; // iterate through buildState, looking to replace [HASH]

    const hash = shorthash.unique(buildResult.contents as string);
    const newID = id.replace(/\[HASH\]/, hash);
    cssHashes.set(id, newID);
    buildState[newID] = buildResult; // copy ref without cloning (using more memory)
    delete buildState[id]; // delete old ref
  }

  // 4. update HTML <link> tags with final hashed URLs
  await Promise.all(
    Object.entries(buildState).map(async ([id, buildResult]) => {
      if (buildResult.contentType !== 'text/html') return;

      const $ = cheerio.load(buildResult.contents);
      const pageCSS = new Set<string>(); // keep track of page-specific CSS so we remove dupes
      $('link[href]').each((i, el) => {
        const oldHref = absoluteURL($(el).attr('href') || '', path.posix.dirname(id)); // note: this may be a relative URL; transform to absolute to find a buildOutput match
        const newHref = cssMap.get(oldHref);
        if (newHref) {
          // note: link[href] will select too much, however, remote CSS and non-CSS link tags won’t be in cssMap
          if (pageCSS.has(newHref)) {
            $(el).remove(); // this is a dupe; remove
          } else {
            $(el).attr('href', cssHashes.get(newHref) || ''); // new CSS; update href (important! use cssHashes, not cssMap)
            pageCSS.add(newHref);
          }
          // bonus: add [rel] and [type]. not necessary, but why not?
          $(el).attr('rel', 'stylesheet');
          $(el).attr('type', 'text/css');
        }
      });
      (buildState[id] as any).contents = $.html(); // save updated HTML in global buildState
    })
  );
}

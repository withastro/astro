import type { AstroComponentMetadata, Renderer, AstroGlobalPartial, SSRResult, SSRElement, GetStaticPathsOptions, ComponentInstance } from '../../@types/astro';
import glob from 'fast-glob';
import { pathToFileURL, fileURLToPath } from 'url';
import { dirname } from 'path';

/** Create the Astro.content() runtime function. */
export function createNewFetchContentFn(fileUrl: URL, mod: ComponentInstance, loadContent: (filePath: string) => Promise<any>): any  {
  const fetchResults: string[][] = [];
  const filePath = fileURLToPath(fileUrl);
  const cwd = dirname(filePath);
  console.log(filePath, cwd, mod);
	return (async (pattern: string, filter?: (data: any) => boolean) => {
		const files = await glob(pattern, {
			cwd,
      absolute: true,
			// Ignore node_modules by default unless explicitly indicated in the pattern
			ignore: /(^|\/)node_modules\//.test(pattern) ? [] : ['**/node_modules/**'],
		});

		// for each file, import it and pass it to filter
		const modules = 
      (await Promise.all(files.map((f) => loadContent(f))))
        .map((mod, i) => {
          // Only return Markdown files for now.
          if (!mod.frontmatter) {
            return;
          }
          const filePath = files[i];
          return {
            file: filePath,
            data: mod.frontmatter,
            Content: mod.default,
            content: mod.metadata,
            // TODO: figure out if we want to do the url property
            // We would need to use some Vite resolution logic, I think 
            // but we may not even want to bring this along
            // url: urlSpec.includes('/pages/') ? urlSpec.replace(/^.*\/pages\//, site.pathname).replace(/(\/index)?\.md$/, '') : undefined,
          };
        })
        .filter(Boolean)
        .filter(filter || (() => true));
    console.log(files, modules);
    
		return [modules as any[], files];
	});

	// 	PREVIOUS CODE - to be deleted before merging
	// 	let allEntries = [...Object.entries(importMetaGlobResult)];
	// 	if (allEntries.length === 0) {
	// 		throw new Error(`[${url.pathname}] Astro.fetchContent() no matches found.`);
	// 	}
	// 	return allEntries
	// 		.map(([spec, mod]) => {
	// 			// Only return Markdown files for now.
	// 			if (!mod.frontmatter) {
	// 				return;
	// 			}
	// 			const urlSpec = new URL(spec, url).pathname;
	// 			return {
	// 				...mod.frontmatter,
	// 				Content: mod.default,
	// 				content: mod.metadata,
	// 				file: new URL(spec, url),
	// 				url: urlSpec.includes('/pages/') ? urlSpec.replace(/^.*\/pages\//, site.pathname).replace(/(\/index)?\.md$/, '') : undefined,
	// 			};
	// 		})
	// 		.filter(Boolean);
	// };
	// // This has to be cast because the type of fetchContent is the type of the function
	// // that receives the import.meta.glob result, but the user is using it as
	// // another type.
	// return fetchContent as unknown as AstroGlobalPartial['fetchContent'];
}

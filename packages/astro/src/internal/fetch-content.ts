/**
 * Convert the result of an `import.meta.globEager()` call to an array of processed
 * Markdown content objects. Filter out any non-Markdown files matched in the glob
 * result, by default.
 */
export function fetchContent(importMetaGlobResult: Record<string, any>, url: string) {
  return [...Object.entries(importMetaGlobResult)]
    .map(([spec, mod]) => {
      // Only return Markdown files, which export the __content object.
      if (!mod.__content) {
        return;
      }
      const urlSpec = new URL(spec, url).pathname.replace(/[\\/\\\\]/, '/');
      return {
        ...mod.__content,
        url: urlSpec.includes('/pages/') && urlSpec.replace(/^.*\/pages\//, '/').replace(/\.md$/, ''),
        file: new URL(spec, url),
      };
    })
    .filter(Boolean);
}

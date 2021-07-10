export async function fetchContent(importMetaGlobResult: Record<string, () => Promise<any>>, url: string) {
    if (typeof importMetaGlobResult === 'string') {
      throw new Error(`[deprecated] "Astro.fetchContent(str)" is now "await Astro.fetchContent(import[dot]meta[dot]glob(str))"`);
    }
    const allImporters = [...Object.entries(importMetaGlobResult)];
    const allImports = await Promise.all(allImporters.map(([spec, imp]) => {
      return imp().then(mod => {
        if (!mod.__content) {
          return;
        }
        const urlSpec = new URL(spec, url).pathname.replace(/[\\/\\\\]/, '/');
        if (!urlSpec.includes('/pages/')) {
          return mod.__content;
        }
        return {
          ...mod.__content,
          url: urlSpec.replace(/^.*\/pages\//, '/').replace(/\.md$/, ''),
        };
      });
    }));
    return allImports.filter(Boolean);
  }
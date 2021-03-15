import { SvelteComponent as Component } from 'svelte';

export function __svelte_static(SvelteComponent: Component) {
  return (attrs: Record<string, any>, ...children: any): string => {
    // TODO include head and css stuff too...
    const { html } = SvelteComponent.render(attrs);
  
    return html;
  };
}

export function __svelte_dynamic(SvelteComponent: Component, importUrl: string) {
  const placeholderId = `placeholder_${String(Math.random())}`;
  return (attrs: Record<string, string>, ...children: any) => {
      return `<div id="${placeholderId}"></div><script type="module">
          import Component from '${importUrl}';

          new Component({
            target: document.getElementById('${placeholderId}'),
            props: ${JSON.stringify(attrs)}
          });
      </script>`;
  };
}

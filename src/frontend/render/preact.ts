import renderToString from 'preact-render-to-string';
import { h, render } from 'preact';
import type { ComponentType } from 'preact';

// This prevents tree-shaking of render.
Function.prototype(render);

export function __preact_static(PreactComponent: ComponentType) {
  return (attrs: Record<string, any>, ...children: any): string => {
    let html = renderToString(
      h(
        PreactComponent, // Preact's types seem wrong...
        attrs,
        children
      )
    );
    return html;
  };
}

export function __preact_load(PreactComponent: ComponentType, importUrl: string, preactUrl: string) {
  const placeholderId = `placeholder_${String(Math.random())}`;
  return (attrs: Record<string, string>, ...children: any) => {
    return `<div id="${placeholderId}"></div><script type="module">
            import {h, render} from '${preactUrl}';
            import Component from '${importUrl}';
            render(h(Component, ${JSON.stringify(attrs)}), document.getElementById('${placeholderId}'));
        </script>`;
  };
}

export function __preact_idle(PreactComponent: ComponentType, importUrl: string, preactUrl: string) {
  const placeholderId = `placeholder_${String(Math.random())}`;
  return (attrs: Record<string, string>, ...children: any) => {
    return `<div id="${placeholderId}"></div><script type="module">
            // TODO: polyfill for Safari
            requestIdleCallback(async () => {
              const [{h, render}, {default: Component}] = await Promise.all([import('${preactUrl}'), import('${importUrl}')]);
              render(h(Component, ${JSON.stringify(attrs)}), document.getElementById('${placeholderId}'));
            });
        </script>`;
  };
}

export function __preact_visible(PreactComponent: ComponentType, importUrl: string, preactUrl: string) {
  const placeholderId = `placeholder_${String(Math.random())}`;
  return (attrs: Record<string, string>, ...children: any) => {
    return `<div id="${placeholderId}"></div><script type="module">
            const observer = new IntersectionObserver(async ([entry], observer) => {
              if (!entry.isIntersecting) return;
              const [{h, render}, {default: Component}] = await Promise.all([import('${preactUrl}'), import('${importUrl}')]);
              render(h(Component, ${JSON.stringify(attrs)}), document.getElementById('${placeholderId}'));
            });
            observer.observe(document.getElementById('${placeholderId}'));
        </script>`;
  };
}

import render from 'preact-render-to-string';
import { h } from 'preact';
import type { Component } from 'preact';

export function __preact_static(PreactComponent: Component) {
  return (attrs: Record<string, any>, ...children: any): string => {
    let html = render(
      h(
        PreactComponent as any, // Preact's types seem wrong...
        attrs,
        children
      )
    );
    return html;
  };
}

export function __preact_dynamic(PreactComponent: Component, importUrl: string, preactUrl: string) {
  const placeholderId = `placeholder_${String(Math.random())}`;
  return (attrs: Record<string, string>, ...children: any) => {
    return `<div id="${placeholderId}"></div><script type="module">
            import {h, render} from '${preactUrl}';
            import Component from '${importUrl}';
            render(h(Component, ${JSON.stringify(attrs)}), document.getElementById('${placeholderId}'));
        </script>`;
  };
}

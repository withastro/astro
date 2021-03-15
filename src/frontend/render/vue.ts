import type { Component } from 'vue';

import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h as createElement } from 'vue';

export function __vue_static(VueComponent: Component) {
  return async (attrs: Record<string, any>, ...children: any): Promise<string> => {
    const app = createSSRApp({
      components: {
        VueComponent
      },
      render() {
        return createElement(VueComponent as any, attrs);
      }
    });

    const html = await renderToString(app);

    return html;
  };
}

export function __vue_dynamic(VueComponent: Component, importUrl: string, vueUrl: string) {
  const placeholderId = `placeholder_${String(Math.random())}`;
  return (attrs: Record<string, string>, ...children: any) => {
      return `<div id="${placeholderId}"></div><script type="module">
          import Component from '${importUrl}';
          import {createApp, h as createElement} from '${vueUrl}';

          const App = {
            render() {
              return createElement(Component, ${JSON.stringify(attrs)});
            }
          };

          createApp(App).mount(document.getElementById('${placeholderId}'));
      </script>`;
  };
}
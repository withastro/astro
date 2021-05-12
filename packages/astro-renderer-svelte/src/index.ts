import type { AstroRenderer } from 'astro/renderer';
import type { SvelteComponent } from 'svelte';

interface SvelteDependencies {
  shared: {},
  server: {
    './SvelteWrapper.svelte': { render: (props: any) => { html: string } }
  },
  client: {
    './runtime.js': typeof import('./runtime')
  }
}

const renderer: AstroRenderer<SvelteDependencies, SvelteComponent> = {
  snowpackPlugin: ['@snowpack/plugin-svelte', { compilerOptions: { hydratable: true } }],

  filter(id) {
    return id.slice(0, -7) === '.svelte';
  },

  server: {
    dependencies: ['./SvelteWrapper.svelte'],
    renderToStaticMarkup({ ["./SvelteWrapper.svelte"]: SvelteWrapper }) {
      return async (Component, props, children) => {
          const { html: code } = SvelteWrapper.render({ __astro_component: Component, __astro_children: children.join('\n'), ...props });
          return { '.html': { code } };
      };
    },
  },

  client: {
    dependencies: ['./runtime.js'],
    hydrateStaticMarkup({ ["./runtime.js"]: runtime }, el) {
      return (Component, props, children) => `
        const {default:render} = ${runtime};
        render(${el}, ${Component}, ${props}, ${children});
      `;
    },
  },
};

export default renderer;

import type { AstroComponent, AstroComponentFactory } from '../internal';

import { spreadAttributes, defineStyleVars, defineScriptVars } from '../internal';

export async function renderAstroComponent(component: InstanceType<typeof AstroComponent>) {
  let template = '';

  for await (const value of component) {
    if (value || value === 0) {
      template += value;
    }
  }

  return template;
}

export async function renderToString(result: any, componentFactory: AstroComponentFactory, props: any, children: any) {
  const Component = await componentFactory(result, props, children);
  let template = await renderAstroComponent(Component);
  return template;
}

export async function renderPage(result: any, Component: AstroComponentFactory, props: any, children: any) {
  const template = await renderToString(result, Component, props, children);
  const styles = Array.from(result.styles).map((style) => `<style>${style}</style>`);
  const scripts = Array.from(result.scripts);
  return template.replace('</head>', styles.join('\n') + scripts.join('\n') + '</head>');
}

function renderElement(name: string, { props: _props, children = ''}: { props: Record<any, any>, children?: string }) {
  const { hoist: _, "data-astro-id": astroId, "define:vars": defineVars, ...props } = _props;
  if (defineVars) {
    if (name === 'style') {
      children = defineStyleVars(astroId, defineVars) + '\n' + children;
    }
    if (name === 'script') {
      children = defineScriptVars(defineVars) + '\n' + children;
    }
  }
  return `<${name}${spreadAttributes(props)}>${children}</${name}>`
}

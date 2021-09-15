import type { AstroComponent, AstroComponentFactory } from '../internal';

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

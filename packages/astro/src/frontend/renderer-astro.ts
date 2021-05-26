export function check(Component: any) {
  return Component.isAstroComponent;
}

export async function renderToStaticMarkup(Component: any, props: any, children: string) {
  const html = await Component.__render(props, children);
  return { html };
}

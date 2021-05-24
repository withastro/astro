export default () => {
  return {
    name: 'astro',
    check: (Component: any) => Component.isAstroComponent,
    renderToStaticMarkup: (Component: any, props: any, children: string) => {
      const html = Component.__render(props, children);
      return { html }
    },
  }
};

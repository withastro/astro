export default () => {
  return {
    name: 'astro',
    check: (Component: any) => Component.isAstroComponent,
    renderToStaticMarkup: async (Component: any, props: any, children: string) => {
      const html = await Component.__render(props, children);
      return { html }
    },
  }
};

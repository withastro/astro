export default () => {
  return {
    name: 'astro',
    check: (Component) => Component.isAstroComponent,
    renderToStaticMarkup: (Component, props, children) => {
      const html = Component.__render(props);
      return { html }
    },
  }
};

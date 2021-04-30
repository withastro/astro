export default {
    jsxFactory: 'createElement',
    jsxFragmentFactory: 'Fragment',
    jsxImportSource: 'react',
    validExtensions: ['.jsx', '.tsx'],
    transformChildrenTo: 'jsx',
    
    server: {
        renderer: 'renderToStaticMarkup',
        rendererSource: 'react-dom/server.js',
        renderToStaticMarkup(jsx, renderToStaticMarkup) {
            const { createElement } = jsx;
            return async (Component, props, children) => {
                const html = renderToStaticMarkup(createElement(Component, props, children));
                return { html }
            }
        }
    },

    client: {
        renderer: 'hydrate',
        rendererSource: 'react-dom',
        hydrateStaticMarkup(jsx, lib, el) {
            return (Component, props, children) => `
                const {createElement:h} = ${jsx};
                const {hydrate} = ${lib};
                hydrate(h(${Component},${props},${children}),${el})
            `
        }
    }
}

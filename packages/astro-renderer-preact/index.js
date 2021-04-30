export default {
    jsxFactory: 'h',
    jsxFragmentFactory: 'Fragment',
    jsxImportSource: 'preact',
    validExtensions: ['.jsx', '.tsx'],
    transformChildrenTo: 'jsx',
    
    server: {
        transformChildrenTo: 'jsx',
        renderer: 'default',
        rendererSource: 'preact-render-to-string',
        renderToStaticMarkup(lib, renderToString) {
            const { h } = lib;
            return async (Component, props, children) => {
                const html = renderToString(h(Component, props, children))
                return { html }
            }
        }
    },

    client: {
        hydrateStaticMarkup(jsx, el) {
            return (Component, props, children) => `
                const {h,hydrate} = ${jsx};
                hydrate(h(${Component},${props},${children}),${el})
            `
        }
    }
}

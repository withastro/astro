export const preact = {
    jsxFactory: 'h',
    jsxFragmentFactory: 'Fragment',
    jsxImportSource: 'preact',
    validExtensions: ['.jsx', '.tsx'],
    
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

export const react = {
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

export const vue = {
    jsxFactory: 'h',
    jsxImportSource: 'vue',
    validExtensions: ['.vue'],
    transformChildrenTo: 'string',
    
    server: {
        renderer: 'renderToString',
        rendererSource: '@vue/server-renderer',
        renderToStaticMarkup(lib, renderToString) {
            const { defineComponent, createSSRApp } = lib;
            return async (Component, props, children) => {
                const App = defineComponent({
                    components: { Component },
                    data: () => ({ props }),
                    template: `<Component v-bind="props">${children.join('\n')}</Component>`,
                });
                const app = createSSRApp(App);
                const html = await renderToString(app);
                return { html };
            }
        }
    },

    client: {
        rendererSource: 'vue',
        hydrateStaticMarkup(_, lib, el) {
            return (Component, props, children) => `
                const {createApp,h} = ${lib};
                const app = {render:()=>h(${Component},${props},{default:()=>${children}})};
                createApp(app).mount(${el});
            `
        }
    }
}

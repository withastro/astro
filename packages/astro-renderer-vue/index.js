export default {
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

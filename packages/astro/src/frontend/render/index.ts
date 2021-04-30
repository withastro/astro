import { childrenToJsx, dedent } from './utils';

export const createRendererPlugin = (plugin: any) => {
    const { jsxFactory, jsxImportSource, validExtensions, transformChildrenTo } = plugin;

    const serverFactory = async () => {
        const { renderer, rendererSource, renderToStaticMarkup } = plugin.server;
        const lib = await import(jsxImportSource);
        const { [renderer]: render } = await import(rendererSource);
        
        return (Component: any) => (props: any, ...children: any) => {
            if (transformChildrenTo === 'jsx') {
                children = childrenToJsx(lib[jsxFactory], children);
            }
            return renderToStaticMarkup(lib, render)(Component, props, children);
        }
    }

    const clientImports: string[] = [];
    
    if (jsxImportSource && ((jsxImportSource === plugin.client.rendererSource) || typeof plugin.client.rendererSource === 'undefined')) {
        clientImports.push(jsxImportSource);
    } else {
        if (jsxImportSource) {
            clientImports.push(jsxImportSource);
        }
        if (plugin.client.rendererSource) {
            clientImports.push(plugin.client.rendererSource);
        }
    }

    const clientFactory = async (astroId: string) => {
        const { hydrateStaticMarkup } = plugin.client;
        return ({ Component, props, children }: any) => {
            let prefix = '';
            let args = []
            if (clientImports.length === 1) {
                args[0] = '$a';
                args[1] = '$a';
                prefix = `const $a=await import('${clientImports[0]}');`;
            } else {
                args[0] = '$a';
                args[1] = '$b';
                prefix = `const [$a,$b]=await Promise.all([${clientImports.map(name => `import('${name}')`).join(',')}]);`;
            }
            args[2] = `document.querySelector("[data-astro-id='${astroId}']")`;
            const result = dedent(hydrateStaticMarkup(...args)(Component, props, children))
            return [prefix, result].join('');
        }
    }

    return {
        jsxImportSource,
        validExtensions,
        clientImports,
        createServerRenderer: serverFactory,
        createClientRenderer: clientFactory
    }
}

// const test = async (plugin) => {
//     const { createServerRenderer, createClientRenderer } = createRenderer(plugin);
//     const serverRender = await createServerRenderer();
//     const { html } = await serverRender(null)({ test: '', children: ['aaaa'] });
//     const hash = shorthash.unique(html);
//     const clientRender = await createClientRenderer(hash);

//     console.log(wrap(html, hash));
//     console.log();
//     console.log(await clientRender({ Component: 'Component', props: JSON.stringify({ test: '' }), children: ['aaaa'] }));
// }

// test();

import type { AstroRenderer } from '../../@types/renderer-new';
import { childrenToJsx, dedent, unique, toSingleObject } from './utils';

export const initRendererPlugin = (plugin: AstroRenderer) => {
    // TODO: validate plugin schema
    const { jsx, server, client } = plugin;

    const serverImportDependencyIds: string[] = [...(server.dependencies ?? [])];
    const clientImportDependencyIds: string[] = [...(client.dependencies ?? [])];
    if (jsx) {
      serverImportDependencyIds.push(jsx.importSource);
      clientImportDependencyIds.push(jsx.importSource);
    }

    const serverImports: string[] = unique(serverImportDependencyIds);
    const clientImports: string[] = unique(clientImportDependencyIds);

    const serverFactory = async () => {
        const { renderToStaticMarkup } = server;
        const dependenciesArr = await Promise.all(serverImports.map((depId: string) => import(depId).then(libCode => ({ [depId]: libCode}))));
        const dependencies = toSingleObject(dependenciesArr);

        return (Component: any) => (props: any, ...children: any) => {
          if (jsx) {
            children = childrenToJsx(dependencies[jsx.importSource][jsx.factory], children);
          }
            return renderToStaticMarkup(dependencies)(Component, props, children);
        }
    }

    const clientFactory = async (astroId: string, [wrapperStart, wrapperEnd]: [string, string] = ['', '']) => {
        // hydrateStaticMarkup: (dependenciesObject: Record<string, any>, element: string) => void
        const { hydrateStaticMarkup } = client;
        return ({ Component, props, children }: any) => {
            const DEPENDENCIES_VAR_NAME = `$$deps`;
            const DEPENDENCIES = toSingleObject(clientImports.map(lib => ({ [lib]: `${DEPENDENCIES_VAR_NAME}['${lib}']` })))
            const ELEMENT_VAR_NAME = `$$el`;
            const prefix = `const ${ELEMENT_VAR_NAME}=document.querySelector("[data-astro-id='${astroId}']");const ${DEPENDENCIES_VAR_NAME}=await Promise.all([${clientImports.map(name => `import('${name}').then(lib => ({['${name}']:lib}))`).join(',')}]).then(res => res.reduce((o,k) => Object.assign(o,k),{}));`;
            const result = dedent(hydrateStaticMarkup(DEPENDENCIES, ELEMENT_VAR_NAME)(Component, props, children))
            return [wrapperStart, prefix, result, wrapperEnd].join('');
        }
    }

    return {
        clientImports,
        getStaticMarkup: serverFactory,
        createClientRenderer: clientFactory
    }
}

// static: _static,
// load: createDynamicRender('(async () => {', '})()'),
// idle: createDynamicRender('requestIdleCallback(async () => {', '})'),
// visible: createDynamicRender(
//   'const o = new IntersectionObserver(async ([entry]) => { if (!entry.isIntersecting) { return; } o.disconnect();',
//   ({ root }) => `}); Array.from(${root}.children).forEach(child => o.observe(child))`
// ),

import { childrenToJsx, dedent, unique, toSingleObject } from './utils';

export const createRendererPlugin = (plugin: any) => {
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

    const clientFactory = async (astroId: string) => {
        // hydrateStaticMarkup: (dependenciesObject: Record<string, any>, element: string) => void
        const { hydrateStaticMarkup } = client;
        return ({ Component, props, children }: any) => {
            const DEPENDENCIES_VAR_NAME = `$$deps`;
            const DEPENDENCIES = toSingleObject(clientImports.map(lib => ({ [lib]: `${DEPENDENCIES_VAR_NAME}['${lib}']` })))
            const ELEMENT_VAR_NAME = `$$el`;
            const prefix = `const ${ELEMENT_VAR_NAME}=document.querySelector("[data-astro-id='${astroId}']");const ${DEPENDENCIES_VAR_NAME}=await Promise.all([${clientImports.map(name => `import('${name}').then(lib => ({['${name}']:lib}))`).join(',')}]).then(res => res.reduce((o,k) => Object.assign(o,k),{}));`;
            const result = dedent(hydrateStaticMarkup([DEPENDENCIES, ELEMENT_VAR_NAME])(Component, props, children))
            return [prefix, result].join('');
        }
    }

    return {
        clientImports,
        createServerRenderer: serverFactory,
        createClientRenderer: clientFactory
    }
}

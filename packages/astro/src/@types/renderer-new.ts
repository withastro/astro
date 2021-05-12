export interface SourceMap {
  version: number;
  file: string;
  sources: string[];
  sourcesContent: string[];
  names: string[];
  mappings: string;

  toString(): string;
  toUrl(): string;
}

export interface StaticAssetResult {
	code: string;
}

export interface CompiledAssetResult {
	code: string;
  map?: SourceMap;
}

export interface AstroRendererResult {
  '.html': StaticAssetResult,
  '.css'?: CompiledAssetResult,
  '.json'?: StaticAssetResult,
  'head'?: StaticAssetResult
}

export type DependencyMap = Record<string, any>
export interface DependencyMaps {
  shared?: DependencyMap;
  server?: DependencyMap;
  client?: DependencyMap;
}

export interface AstroRenderer<Dependencies extends DependencyMaps = DependencyMaps> {
  /** Optionally declare a snowpackPlugin which should be used to render your components */
  snowpackPlugin?: string;

  /** Optionally define JSX behavior if this renderer relies on JSX */
  jsx?: {
    /** Define which package JSX should be imported from */
    importSource: string;
    /** Define the jsxFactory (for example, 'createElement' for React or 'h' for other frameworks) */
    factory: string;
    /** Define the jsxFragmentFactory (in most cases, 'Fragment') */
    fragmentFactory?: string;
    /** 
      * If `true`, the component `children` will be converted to VDOM nodes 
      *
      * If `falsy`, the component `children` will be a string of HTML
      */
    transformChildren?: boolean;
  }
  /** Define how components should be rendered on the server */
  server: {
    /** Define the dependencies necessary for rendering your components on the server */
    dependencies?: (keyof Dependencies['server'] | keyof Dependencies['shared'])[],
    /**
      * Define a factory function which renders a component to static strings of different asset types
      * The factory must return the `AstroRendererResult`
      * @param dependencies An object containing your declared server dependencies (and if needed the `jsx.factory`), keyed by import specifier
      */
    renderToStaticMarkup: (dependencies: Dependencies['server'] & Dependencies['shared']) => 
      /**
        * @param Component The framework component
        * @param props The component's props
        * @param children An array of the component's children (as VDOM nodes or HTML strings, depending on `jsx.transformChildren`)
        */
      (Component: any, props: Record<string|number, any>, children: any[]) => AstroRendererResult|Promise<AstroRendererResult>
  },
  /** Define how components should be hydrated on the client */
  client: {
    /** Define the dependencies necessary for hydrating your components on the client */
    dependencies?: (keyof Dependencies['client'] | keyof Dependencies['shared'])[],
    /**
      * Define a factory function which hydrates a component to on the client.
      * The factory must return a `string` of JavaScript code to be injected on the client.
      * @param dependencies An object containing runtime keys to your declared client dependencies (and if needed the `jsx.factory`), keyed by import specifier
      * @param element A variable representing the element where this component should be mounted
      */
    hydrateStaticMarkup: (dependencies: Record<keyof Dependencies['client'] | keyof Dependencies['shared'], string>, element: string) => 
      /**
        * @param Component The variable name of your component
        * @param props A serialized representation of your component's props
        * @param children A serialized representation of the component's children (as VDOM nodes or HTML strings, depending on `jsx.transformChildren`)
        */
      (Component: string, props: string, children: string[]) => string;
  }
}

// jsx: {
//     importSource: 'preact',
//     factory: 'h',
//     fragmentFactory: 'Fragment',
//     transformChildren: true,
//   },

//   server: {
//     dependencies: ['preact', 'preact-render-to-string'],
//     renderToStaticMarkup([preact, preactRenderToString]) {
//       const { h } = preact;
//       const { renderToString } = preactRenderToString;
//       return async (Component, props, children) => {
//         const html = renderToString(h(Component, props, children));
//         return { html };
//       };
//     },
//   },

//   client: {
//     dependencies: ['preact'],
//     hydrateStaticMarkup([preact], el) {
//       return (Component, props, children) => `
//         const {h,hydrate} = ${preact};
//         hydrate(h(${Component},${props},${children}),${el})
//       `;
//     },
//   },

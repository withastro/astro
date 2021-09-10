declare module '@astrojs/compiler' {
  export type Platform = 'browser' | 'node' | 'neutral';
  export type SourceMap = any;

  export interface TransformOptions {}

  export interface TransformResult {
    code: string;
    map: SourceMap;
    warnings: any[];
  }

  export interface TransformResults {
    js: TransformResult;
    css?: TransformResult;
  }

  // This function transforms a single JavaScript file. It can be used to minify
  // JavaScript, convert TypeScript/JSX to JavaScript, or convert newer JavaScript
  // to older JavaScript. It returns a promise that is either resolved with a
  // "TransformResult" object or rejected with a "TransformFailure" object.
  //
  // Works in node: yes
  // Works in browser: yes
  export declare function transform(input: string, options?: TransformOptions): Promise<string>;

  // This configures the browser-based version of astro. It is necessary to
  // call this first and wait for the returned promise to be resolved before
  // making other API calls when using astro in the browser.
  //
  // Works in node: yes
  // Works in browser: yes ("options" is required)
  export declare function initialize(options: InitializeOptions): Promise<void>;

  export interface InitializeOptions {
    // The URL of the "astro.wasm" file. This must be provided when running
    // astro in the browser.
    wasmURL?: string;

    // By default astro runs the WebAssembly-based browser API in a web worker
    // to avoid blocking the UI thread. This can be disabled by setting "worker"
    // to false.
    worker?: boolean;
  }
}

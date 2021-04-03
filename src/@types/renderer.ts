export interface DynamicRenderContext {
  componentUrl: string;
  componentExport: string;
  frameworkUrls: string;
}

export interface ComponentRenderer {
  renderStatic: StaticRendererGenerator;
  render(context: { root: string; Component: string; props: string; [key: string]: string }): string;
  imports?: Record<string, string[]>;
}

export interface ComponentContext {
  'data-astro-id': string;
  root: string;
}

export type StaticRenderer = (props: Record<string, any>, ...children: any[]) => Promise<string>;
export type StaticRendererGenerator<T = any> = (Component: T) => StaticRenderer;
export type DynamicRenderer = (props: Record<string, any>, ...children: any[]) => Promise<string>;
export type DynamicRendererContext<T = any> = (Component: T, renderContext: DynamicRenderContext) => DynamicRenderer;
export type DynamicRendererGenerator = (
  wrapperStart: string | ((context: ComponentContext) => string),
  wrapperEnd: string | ((context: ComponentContext) => string)
) => DynamicRendererContext;

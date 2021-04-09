import type { Component as VueComponent } from 'vue';
import type { ComponentType as PreactComponent } from 'preact';
import type { ComponentType as ReactComponent } from 'react';
import type { SvelteComponent } from 'svelte';

export interface DynamicRenderContext {
  componentUrl: string;
  componentExport: string;
  frameworkUrls: string;
}

export interface ComponentRenderer<T> {
  renderStatic: StaticRendererGenerator<T>;
  render(context: { root: string; Component: string; props: string; [key: string]: string }): string;
  imports?: Record<string, string[]>;
}

export interface ComponentContext {
  'data-astro-id': string;
  root: string;
}

export type SupportedComponentRenderer =
  | ComponentRenderer<VueComponent>
  | ComponentRenderer<PreactComponent>
  | ComponentRenderer<ReactComponent>
  | ComponentRenderer<SvelteComponent>;
export type StaticRenderer = (props: Record<string, any>, ...children: any[]) => Promise<string>;
export type StaticRendererGenerator<T = any> = (Component: T) => StaticRenderer;
export type DynamicRenderer = (props: Record<string, any>, ...children: any[]) => Promise<string>;
export type DynamicRendererContext<T = any> = (Component: T, renderContext: DynamicRenderContext) => DynamicRenderer;
export type DynamicRendererGenerator = (
  wrapperStart: string | ((context: ComponentContext) => string),
  wrapperEnd: string | ((context: ComponentContext) => string)
) => DynamicRendererContext;

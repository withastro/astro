import type { RendererInstance } from '../internal/__astro_component';

declare function setRenderers(instances: RendererInstance[]): void;
declare let rendererInstances: RendererInstance[];

setRenderers(rendererInstances);

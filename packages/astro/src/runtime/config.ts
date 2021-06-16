import { setRenderers } from 'astro/dist/internal/__astro_component.js';

declare let rendererSources: string[];
declare let renderers: any[];

setRenderers(rendererSources, renderers);
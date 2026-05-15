import type { ClientDirective } from '../../types/public/integrations.js';
/**
 * Hydrate this component when one of its children becomes visible
 * We target the children because `astro-island` is set to `display: contents`
 * which doesn't work with IntersectionObserver
 */
declare const visibleDirective: ClientDirective;
export default visibleDirective;

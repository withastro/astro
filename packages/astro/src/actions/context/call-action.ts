import type { RenderContextExtension } from '@astrojs/vite-plugin-router';
import type { APIContext } from '../../types/public/context.js';
import { createCallAction } from '../utils.js';

/**
 * `Astro.callAction()` / `context.callAction()`. Binds each call to the request's current action
 * context, which a rewrite replaces.
 */
const callAction: RenderContextExtension<APIContext['callAction']> = (state) => ({
	create: () => (action, input) => createCallAction(state.getActionAPIContext())(action, input),
});
export default callAction;

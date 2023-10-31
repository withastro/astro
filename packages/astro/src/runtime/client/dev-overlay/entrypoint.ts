import type { DevOverlayPlugin as DevOverlayPluginDefinition } from '../../../@types/astro.js';
import { type AstroDevOverlay, type DevOverlayPlugin } from './overlay.js';

let overlay: AstroDevOverlay;

document.addEventListener('DOMContentLoaded', async () => {
	const [
		{ loadDevOverlayPlugins },
		{ default: astroDevToolPlugin },
		{ default: astroAuditPlugin },
		{ default: astroXrayPlugin },
		{ AstroDevOverlay, DevOverlayCanvas },
		{ DevOverlayCard },
		{ DevOverlayHighlight },
		{ DevOverlayTooltip },
		{ DevOverlayWindow },
	] = await Promise.all([
		// @ts-expect-error
		import('astro:dev-overlay'),
		import('./plugins/astro.js'),
		import('./plugins/audit.js'),
		import('./plugins/xray.js'),
		import('./overlay.js'),
		import('./ui-library/card.js'),
		import('./ui-library/highlight.js'),
		import('./ui-library/tooltip.js'),
		import('./ui-library/window.js'),
	]);

	// Register custom elements
	customElements.define('astro-dev-overlay', AstroDevOverlay);
	customElements.define('astro-dev-overlay-window', DevOverlayWindow);
	customElements.define('astro-dev-overlay-plugin-canvas', DevOverlayCanvas);
	customElements.define('astro-dev-overlay-tooltip', DevOverlayTooltip);
	customElements.define('astro-dev-overlay-highlight', DevOverlayHighlight);
	customElements.define('astro-dev-overlay-card', DevOverlayCard);

	overlay = document.createElement('astro-dev-overlay');

	const preparePlugin = (
		pluginDefinition: DevOverlayPluginDefinition,
		builtIn: boolean
	): DevOverlayPlugin => {
		const eventTarget = new EventTarget();
		const plugin = {
			...pluginDefinition,
			builtIn: builtIn,
			active: false,
			status: 'loading' as const,
			eventTarget: eventTarget,
		};

		// Events plugins can send to the overlay to update their status
		eventTarget.addEventListener('plugin-notification', (evt) => {
			const target = overlay.shadowRoot?.querySelector(`[data-plugin-id="${plugin.id}"]`);
			if (!target) return;

			let newState = true;
			if (evt instanceof CustomEvent) {
				newState = evt.detail.state ?? true;
			}

			target.querySelector('.notification')?.toggleAttribute('data-active', newState);
		});

		return plugin;
	};

	const customPluginsDefinitions = (await loadDevOverlayPlugins()) as DevOverlayPluginDefinition[];
	const plugins: DevOverlayPlugin[] = [
		...[astroDevToolPlugin, astroXrayPlugin, astroAuditPlugin].map((pluginDef) =>
			preparePlugin(pluginDef, true)
		),
		...customPluginsDefinitions.map((pluginDef) => preparePlugin(pluginDef, false)),
	];

	overlay.plugins = plugins;

	document.body.append(overlay);

	document.addEventListener('astro:after-swap', () => {
		document.body.append(overlay);
	});
});

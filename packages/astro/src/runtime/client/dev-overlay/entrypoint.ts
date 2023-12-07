import type { DevOverlayPlugin as DevOverlayPluginDefinition } from '../../../@types/astro.js';
import type { AstroDevOverlay, DevOverlayPlugin } from './overlay.js';
import { settings } from './settings.js';
// @ts-expect-error
import { loadDevOverlayPlugins } from 'astro:dev-overlay';

let overlay: AstroDevOverlay;

document.addEventListener('DOMContentLoaded', async () => {
	const [
		customPluginsDefinitions,
		{ default: astroDevToolPlugin },
		{ default: astroAuditPlugin },
		{ default: astroXrayPlugin },
		{ default: astroSettingsPlugin },
		{ AstroDevOverlay, DevOverlayCanvas, getPluginIcon },
		{
			DevOverlayCard,
			DevOverlayHighlight,
			DevOverlayTooltip,
			DevOverlayWindow,
			DevOverlayToggle,
			DevOverlayButton,
			DevOverlayBadge,
			DevOverlayIcon,
		},
	] = await Promise.all([
		loadDevOverlayPlugins() as DevOverlayPluginDefinition[],
		import('./plugins/astro.js'),
		import('./plugins/audit/index.js'),
		import('./plugins/xray.js'),
		import('./plugins/settings.js'),
		import('./overlay.js'),
		import('./ui-library/index.js'),
	]);

	// Register custom elements
	customElements.define('astro-dev-toolbar', AstroDevOverlay);
	customElements.define('astro-dev-toolbar-window', DevOverlayWindow);
	customElements.define('astro-dev-toolbar-plugin-canvas', DevOverlayCanvas);
	customElements.define('astro-dev-toolbar-tooltip', DevOverlayTooltip);
	customElements.define('astro-dev-toolbar-highlight', DevOverlayHighlight);
	customElements.define('astro-dev-toolbar-card', DevOverlayCard);
	customElements.define('astro-dev-toolbar-toggle', DevOverlayToggle);
	customElements.define('astro-dev-toolbar-button', DevOverlayButton);
	customElements.define('astro-dev-toolbar-badge', DevOverlayBadge);
	customElements.define('astro-dev-toolbar-icon', DevOverlayIcon);

	// Add deprecated names
	const deprecated = (Parent: any) => class extends Parent {};
	customElements.define('astro-dev-overlay', deprecated(AstroDevOverlay));
	customElements.define('astro-dev-overlay-window', deprecated(DevOverlayWindow));
	customElements.define('astro-dev-overlay-plugin-canvas', deprecated(DevOverlayCanvas));
	customElements.define('astro-dev-overlay-tooltip', deprecated(DevOverlayTooltip));
	customElements.define('astro-dev-overlay-highlight', deprecated(DevOverlayHighlight));
	customElements.define('astro-dev-overlay-card', deprecated(DevOverlayCard));
	customElements.define('astro-dev-overlay-toggle', deprecated(DevOverlayToggle));
	customElements.define('astro-dev-overlay-button', deprecated(DevOverlayButton));
	customElements.define('astro-dev-overlay-badge', deprecated(DevOverlayBadge));
	customElements.define('astro-dev-overlay-icon', deprecated(DevOverlayIcon));

	overlay = document.createElement('astro-dev-toolbar');

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
			notification: { state: false },
			eventTarget: eventTarget,
		};

		// Events plugins can send to the overlay to update their status
		eventTarget.addEventListener('toggle-notification', (evt) => {
			const target = overlay.shadowRoot?.querySelector(`[data-plugin-id="${plugin.id}"]`);
			if (!target) return;

			let newState = true;
			if (evt instanceof CustomEvent) {
				newState = evt.detail.state ?? true;
			}

			plugin.notification.state = newState;

			target.querySelector('.notification')?.toggleAttribute('data-active', newState);
		});

		const onToggleApp = async (evt: Event) => {
			let newState = undefined;
			if (evt instanceof CustomEvent) {
				newState = evt.detail.state ?? true;
			}

			await overlay.setPluginStatus(plugin, newState);
		};

		eventTarget.addEventListener('toggle-app', onToggleApp);
		// Deprecated
		eventTarget.addEventListener('toggle-plugin', onToggleApp);

		return plugin;
	};

	const astromorePlugin = {
		id: 'astro:more',
		name: 'More',
		icon: 'dots-three',
		init(canvas, eventTarget) {
			const hiddenPlugins = plugins.filter((p) => !p.builtIn).slice(overlay.customPluginsToShow);

			createDropdown();

			document.addEventListener('astro:after-swap', createDropdown);

			function createDropdown() {
				const style = document.createElement('style');
				style.innerHTML = `
					#dropdown {
						background: rgba(19, 21, 26, 1);
						border: 1px solid rgba(52, 56, 65, 1);
						border-radius: 12px;
						box-shadow: 0px 0px 0px 0px rgba(19, 21, 26, 0.30), 0px 1px 2px 0px rgba(19, 21, 26, 0.29), 0px 4px 4px 0px rgba(19, 21, 26, 0.26), 0px 10px 6px 0px rgba(19, 21, 26, 0.15), 0px 17px 7px 0px rgba(19, 21, 26, 0.04), 0px 26px 7px 0px rgba(19, 21, 26, 0.01);
						width: 192px;
						padding: 8px;
						z-index: 2000000010;
						transform: translate(-50%, 0%);
						position: fixed;
						bottom: 72px;
						left: 50%;
					}

					.notification {
						display: none;
						position: absolute;
						top: -4px;
						right: -6px;
						width: 8px;
						height: 8px;
						border-radius: 9999px;
						border: 1px solid rgba(19, 21, 26, 1);
						background: #B33E66;
					}

					#dropdown:not([data-no-notification]) .notification[data-active] {
						display: block;
					}

					#dropdown button {
						border: 0;
						background: transparent;
						color: white;
						font-family: system-ui, sans-serif;
						font-size: 14px;
						white-space: nowrap;
						text-decoration: none;
						margin: 0;
						display: flex;
						align-items: center;
						width: 100%;
						padding: 8px;
						border-radius: 8px;
					}

					#dropdown button:hover, #dropdown button:focus-visible {
						background: #FFFFFF20;
						cursor: pointer;
					}

					#dropdown button.active {
						background: rgba(71, 78, 94, 1);
					}

					#dropdown .icon {
						position: relative;
						height: 20px;
						width: 20px;
						padding: 1px;
						margin-right: 0.5em;
					}

					#dropdown .icon svg {
						max-height: 100%;
						max-width: 100%;
					}
				`;
				canvas.append(style);

				const dropdown = document.createElement('div');
				dropdown.id = 'dropdown';
				dropdown.toggleAttribute('data-no-notification', settings.config.disablePluginNotification);

				for (const plugin of hiddenPlugins) {
					const buttonContainer = document.createElement('div');
					buttonContainer.classList.add('item');
					const button = document.createElement('button');
					button.setAttribute('data-plugin-id', plugin.id);

					const iconContainer = document.createElement('div');
					const iconElement = document.createElement('template');
					iconElement.innerHTML = getPluginIcon(plugin.icon);
					iconContainer.append(iconElement.content.cloneNode(true));

					const notification = document.createElement('div');
					notification.classList.add('notification');
					iconContainer.append(notification);
					iconContainer.classList.add('icon');

					button.append(iconContainer);
					button.append(document.createTextNode(plugin.name));

					button.addEventListener('click', () => {
						overlay.togglePluginStatus(plugin);
					});
					buttonContainer.append(button);

					dropdown.append(buttonContainer);

					plugin.eventTarget.addEventListener('toggle-notification', (evt) => {
						if (!(evt instanceof CustomEvent)) return;

						notification.toggleAttribute('data-active', evt.detail.state ?? true);

						eventTarget.dispatchEvent(
							new CustomEvent('toggle-notification', {
								detail: {
									state: hiddenPlugins.some((p) => p.notification.state === true),
								},
							})
						);
					});
				}

				canvas.append(dropdown);
			}
		},
	} satisfies DevOverlayPluginDefinition;

	const plugins: DevOverlayPlugin[] = [
		...[
			astroDevToolPlugin,
			astroXrayPlugin,
			astroAuditPlugin,
			astroSettingsPlugin,
			astromorePlugin,
		].map((pluginDef) => preparePlugin(pluginDef, true)),
		...customPluginsDefinitions.map((pluginDef) => preparePlugin(pluginDef, false)),
	];

	overlay.plugins = plugins;

	document.body.append(overlay);

	document.addEventListener('astro:after-swap', () => {
		document.body.append(overlay);
	});
});

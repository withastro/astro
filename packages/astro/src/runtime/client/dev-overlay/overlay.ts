// @ts-expect-error
import { loadDevToolsPlugins } from 'astro:dev-tools';
import type { DevOverlayItem as DevOverlayItemDefinition } from '../../../@types/astro.js';
import astroDevToolPlugin from './plugins/astro.js';
import astroAuditPlugin from './plugins/audit.js';
import astroXrayPlugin from './plugins/xray.js';
import { DevOverlayHighlight, DevOverlayTooltip, DevOverlayWindow } from './ui-toolkit.js';

type DevOverlayItem = DevOverlayItemDefinition & {
	active: boolean;
	inited: boolean;
	eventTarget: EventTarget;
};

document.addEventListener('DOMContentLoaded', async () => {
	const builtinPlugins: DevOverlayItem[] = [
		astroDevToolPlugin,
		astroXrayPlugin,
		astroAuditPlugin,
	].map((plugin) => ({ ...plugin, active: false, inited: false, eventTarget: new EventTarget() }));
	const customPluginsImports = (await loadDevToolsPlugins()) as DevOverlayItem[];
	const customPlugins: DevOverlayItem[] = [];
	customPlugins.push(...customPluginsImports.map((plugin) => ({ ...plugin, active: false })));

	const plugins: DevOverlayItem[] = [...builtinPlugins, ...customPlugins];

	class AstroDevOverlay extends HTMLElement {
		shadowRoot: ShadowRoot;

		constructor() {
			super();
			this.shadowRoot = this.attachShadow({ mode: 'closed' });
		}

		// connect component
		async connectedCallback() {
			this.shadowRoot.innerHTML = `
    <style>
      #dev-overlay {
				display: inline-block;
				position: fixed;
				bottom: 7.5%;
				left: 50%;
				transform: translate(-50%, 0%);
				height: 56px;
				overflow: hidden;

				background: linear-gradient(180deg, #13151A 0%, rgba(19, 21, 26, 0.88) 100%);
				box-shadow: 0px 0px 0px 0px #13151A4D;
				border: 1px solid #343841;
				border-radius: 9999px;
				z-index: 999999;
			}

			#dev-overlay .item {
				display: flex;
				justify-content: center;
				align-items: center;
				width: 64px;
			}

			#dev-overlay #bar-container .item:hover {
				background: rgba(27, 30, 36, 1);
				cursor: pointer;
			}

			#dev-overlay #bar-container .item.active {
				background: rgba(71, 78, 94, 1);
			}

			#dev-overlay .item svg {
				width: 24px;
				height: 24px;
				display: block;
				margin: auto;
			}

			#dev-overlay #bar-container {
				height: 100%;
				display: flex;
			}

			#dev-overlay .separator {
				background: rgba(52, 56, 65, 1);
				width: 1px;
			}

			astro-overlay-plugin-canvas:not([data-active]) {
				display: none;
			}
    </style>

    <div id="dev-overlay">
			<div id="bar-container">
				${builtinPlugins.map((plugin) => this.getPluginTemplate(plugin)).join('')}
				<div class="separator"></div>
				${customPluginsImports.map((plugin) => this.getPluginTemplate(plugin)).join('')}
			</div>
		</div>`;

			this.attachClickEvents();
		}

		attachClickEvents() {
			const items = this.shadowRoot.querySelectorAll<HTMLDivElement>('.item');
			if (!items) return;
			items.forEach((item) => {
				item.addEventListener('click', async (e) => {
					const target = e.currentTarget;
					if (!target || !(target instanceof HTMLElement)) return;

					const id = target.dataset.pluginId;
					if (!id) return;

					const plugin = this.getPluginById(id);
					if (!plugin) return;
					const shadowRoot = this.getPluginCanvasById(plugin.id)!.shadowRoot!;
					if (!plugin.inited) {
						await plugin.init?.(shadowRoot, plugin.eventTarget);
						plugin.inited = true;
					}

					this.togglePluginStatus(plugin);
					plugin.eventTarget.dispatchEvent(
						new CustomEvent('plugin-toggle', {
							detail: {
								state: plugin.active,
								plugin,
							},
						})
					);
				});
			});
		}

		getPluginTemplate(plugin: DevOverlayItem) {
			return `<div class="item" data-plugin-id="${plugin.id}">
				<div class="icon">${plugin.icon}</div>
			</div>`;
		}

		getPluginById(id: string) {
			return plugins.find((plugin) => plugin.id === id);
		}

		getPluginCanvasById(id: string) {
			return this.shadowRoot.querySelector(`astro-overlay-plugin-canvas[data-plugin-id="${id}"]`);
		}

		togglePluginStatus(plugin: DevOverlayItem, status?: boolean) {
			plugin.active = status ?? !plugin.active;
			const target = this.shadowRoot.querySelector(`[data-plugin-id="${plugin.id}"]`);
			if (!target) return;
			target.classList.toggle('active', plugin.active);
			this.getPluginCanvasById(plugin.id)?.toggleAttribute('data-active', plugin.active);
		}
	}

	class DevOverlayCanvas extends HTMLElement {
		shadowRoot: ShadowRoot;

		constructor() {
			super();
			this.shadowRoot = this.attachShadow({ mode: 'closed' });
		}

		// connect component
		async connectedCallback() {
			this.shadowRoot.innerHTML = ``;
		}
	}

	customElements.define('astro-dev-overlay', AstroDevOverlay);
	customElements.define('astro-dev-overlay-window', DevOverlayWindow);
	customElements.define('astro-overlay-plugin-canvas', DevOverlayCanvas);
	customElements.define('astro-overlay-tooltip', DevOverlayTooltip);
	customElements.define('astro-overlay-highlight', DevOverlayHighlight);

	const overlay = document.createElement('astro-dev-overlay');
	overlay.style.zIndex = '999999';
	document.body.appendChild(overlay);

	// Create plugin canvases
	plugins.forEach((plugin) => {
		const pluginCanvas = document.createElement('astro-overlay-plugin-canvas');
		pluginCanvas.dataset.pluginId = plugin.id;
		overlay.shadowRoot?.appendChild(pluginCanvas);
	});
});

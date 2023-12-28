/* eslint-disable no-console */
import type {
	DevOverlayMetadata,
	DevOverlayPlugin as DevOverlayPluginDefinition,
} from '../../../@types/astro.js';
import { settings } from './settings.js';
import { getIconElement, isDefinedIcon, type Icon } from './ui-library/icons.js';

export type DevOverlayPlugin = DevOverlayPluginDefinition & {
	builtIn: boolean;
	active: boolean;
	status: 'ready' | 'loading' | 'error';
	notification: {
		state: boolean;
	};
	eventTarget: EventTarget;
};
const WS_EVENT_NAME = 'astro-dev-toolbar';
const WS_EVENT_NAME_DEPRECATED = 'astro-dev-overlay';
const HOVER_DELAY = 2 * 1000;
const DEVBAR_HITBOX_ABOVE = 42;

export class AstroDevOverlay extends HTMLElement {
	shadowRoot: ShadowRoot;
	delayedHideTimeout: number | undefined;
	devOverlay: HTMLDivElement | undefined;
	plugins: DevOverlayPlugin[] = [];
	hasBeenInitialized = false;
	// TODO: This should be dynamic based on the screen size or at least configurable, erika - 2023-11-29
	customPluginsToShow = 3;

	constructor() {
		super();
		this.shadowRoot = this.attachShadow({ mode: 'open' });
	}

	/**
	 * All one-time DOM setup runs through here. Only ever call this once,
	 * in connectedCallback(), and protect it from being called again.
	 */
	init() {
		this.shadowRoot.innerHTML = `
		<style>
			:host {
				/* Important! Reset all inherited styles to initial */
				all: initial;
				z-index: 999999;
				view-transition-name: astro-dev-toolbar;
				display: contents;
			}

			::view-transition-old(astro-dev-toolbar),
			::view-transition-new(astro-dev-toolbar) {
				animation: none;
			}

			#dev-overlay {
				position: fixed;
				bottom: 0px;
				left: 50%;
				transform: translate(-50%, 0%);
				z-index: 2000000010;
				display: flex;
				flex-direction: column;
				align-items: center;
				transition: bottom 0.35s cubic-bezier(0.485, -0.050, 0.285, 1.505);
				pointer-events: none;
			}

			#dev-overlay[data-hidden] {
				bottom: -40px;
			}

			#dev-overlay[data-hidden] #dev-bar .item {
				opacity: 0.2;
			}

			#dev-bar-hitbox-above,
			#dev-bar-hitbox-below {
				width: 100%;
				pointer-events: auto;
			}
			#dev-bar-hitbox-above {
				height: ${DEVBAR_HITBOX_ABOVE}px;
			}
			#dev-bar-hitbox-below {
				height: 16px;
			}
			#dev-bar {
				height: 40px;
				overflow: hidden;
				pointer-events: auto;
				background: linear-gradient(180deg, #13151A 0%, rgba(19, 21, 26, 0.88) 100%);
				border: 1px solid #343841;
				border-radius: 9999px;
				box-shadow: 0px 0px 0px 0px rgba(19, 21, 26, 0.30), 0px 1px 2px 0px rgba(19, 21, 26, 0.29), 0px 4px 4px 0px rgba(19, 21, 26, 0.26), 0px 10px 6px 0px rgba(19, 21, 26, 0.15), 0px 17px 7px 0px rgba(19, 21, 26, 0.04), 0px 26px 7px 0px rgba(19, 21, 26, 0.01);
			}

			@media (forced-colors: active) {
				#dev-bar {
					background: white;
				}
			}

			#dev-bar .item {
				display: flex;
				justify-content: center;
				align-items: center;
				width: 44px;
				border: 0;
				background: transparent;
				color: white;
				font-family: system-ui, sans-serif;
				font-size: 1rem;
				line-height: 1.2;
				white-space: nowrap;
				text-decoration: none;
				padding: 0;
				margin: 0;
				overflow: hidden;
				transition: opacity 0.2s ease-out 0s;
			}

			#dev-bar #bar-container .item:hover, #dev-bar #bar-container .item:focus-visible {
				background: #FFFFFF20;
				cursor: pointer;
				outline-offset: -3px;
			}

			#dev-bar .item:first-of-type {
				border-top-left-radius: 9999px;
				border-bottom-left-radius: 9999px;
				width: 42px;
				padding-left: 4px;
			}

			#dev-bar .item:last-of-type {
				border-top-right-radius: 9999px;
				border-bottom-right-radius: 9999px;
				width: 42px;
				padding-right: 4px;
			}
			#dev-bar #bar-container .item.active {
				background: rgba(71, 78, 94, 1);
			}

			#dev-bar .item-tooltip {
				background: linear-gradient(0deg, #13151A, #13151A), linear-gradient(0deg, #343841, #343841);
				border: 1px solid rgba(52, 56, 65, 1);
				border-radius: 4px;
				padding: 4px 8px;
				position: absolute;
				top: ${4 - DEVBAR_HITBOX_ABOVE}px;
				font-size: 14px;
				opacity: 0;
				transition: opacity 0.2s ease-in-out 0s;
				pointer-events: none;
			}

			#dev-bar .item-tooltip::after{
				content: '';
				position: absolute;
				left: calc(50% - 5px);
				bottom: -6px;
				border-left: 5px solid transparent;
				border-right: 5px solid transparent;
				border-top: 5px solid #343841;
			}

			#dev-bar .item:hover .item-tooltip, #dev-bar .item:not(.active):focus-visible .item-tooltip {
				transition: opacity 0.2s ease-in-out 200ms;
				opacity: 1;
			}

			@media (forced-colors: active) {
				#dev-bar .item:hover .item-tooltip,
				#dev-bar .item:not(.active):focus-visible .item-tooltip {
					background: white;
				}
			}

			#dev-bar #bar-container .item.active .notification {
				border-color: rgba(71, 78, 94, 1);
			}

			#dev-bar .item .icon {
				position: relative;
				max-width: 20px;
				max-height: 20px;
				user-select: none;
			}

			#dev-bar .item svg {
				width: 20px;
				height: 20px;
				display: block;
				margin: auto;
			}

			@media (forced-colors: active) {
				#dev-bar .item svg path[fill="#fff"] {
					fill: black;
				}
			}

			#dev-bar .item .notification {
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

			#dev-overlay:not([data-no-notification]) #dev-bar .item .notification[data-active] {
				display: block;
			}

			#dev-bar #bar-container {
				height: 100%;
				display: flex;
			}

			#dev-bar .separator {
				background: rgba(52, 56, 65, 1);
				width: 1px;
			}
		</style>
		<div id="dev-overlay" data-hidden ${
			settings.config.disablePluginNotification ? 'data-no-notification' : ''
		}>
			<div id="dev-bar-hitbox-above"></div>
			<div id="dev-bar">
				<div id="bar-container">
					${this.plugins
						.filter(
							(plugin) => plugin.builtIn && !['astro:settings', 'astro:more'].includes(plugin.id)
						)
						.map((plugin) => this.getPluginTemplate(plugin))
						.join('')}
					${
						this.plugins.filter((plugin) => !plugin.builtIn).length > 0
							? `<div class="separator"></div>${this.plugins
									.filter((plugin) => !plugin.builtIn)
									.slice(0, this.customPluginsToShow)
									.map((plugin) => this.getPluginTemplate(plugin))
									.join('')}`
							: ''
					}
					${
						this.plugins.filter((plugin) => !plugin.builtIn).length > this.customPluginsToShow
							? this.getPluginTemplate(
									this.plugins.find((plugin) => plugin.builtIn && plugin.id === 'astro:more')!
								)
							: ''
					}
					<div class="separator"></div>
					${this.getPluginTemplate(
						this.plugins.find((plugin) => plugin.builtIn && plugin.id === 'astro:settings')!
					)}
				</div>
			</div>
			<div id="dev-bar-hitbox-below"></div>
		</div>`;

		this.devOverlay = this.shadowRoot.querySelector<HTMLDivElement>('#dev-overlay')!;
		this.attachEvents();

		// Create plugin canvases
		this.plugins.forEach(async (plugin) => {
			if (settings.config.verbose) console.log(`Creating plugin canvas for ${plugin.id}`);
			const pluginCanvas = document.createElement('astro-dev-toolbar-plugin-canvas');
			pluginCanvas.dataset.pluginId = plugin.id;
			this.shadowRoot?.append(pluginCanvas);
		});

		// Init plugin lazily, so that the page can load faster.
		// Fallback to setTimeout for Safari (sad!)
		if ('requestIdleCallback' in window) {
			window.requestIdleCallback(
				async () => {
					this.plugins.map((plugin) => this.initPlugin(plugin));
				},
				{ timeout: 300 }
			);
		} else {
			setTimeout(async () => {
				this.plugins.map((plugin) => this.initPlugin(plugin));
			}, 300);
		}
	}

	// This is called whenever the component is connected to the DOM.
	// This happens on first page load, and on each page change when
	// view transitions are used.
	connectedCallback() {
		if (!this.hasBeenInitialized) {
			this.init();
			this.hasBeenInitialized = true;
		}

		// Run this every time to make sure the correct plugin is open.
		this.plugins.forEach(async (plugin) => {
			await this.setPluginStatus(plugin, plugin.active);
		});
	}

	attachEvents() {
		const items = this.shadowRoot.querySelectorAll<HTMLDivElement>('.item');
		items.forEach((item) => {
			item.addEventListener('click', async (event) => {
				const target = event.currentTarget;
				if (!target || !(target instanceof HTMLElement)) return;
				const id = target.dataset.pluginId;
				if (!id) return;
				const plugin = this.getPluginById(id);
				if (!plugin) return;
				event.stopPropagation();
				await this.togglePluginStatus(plugin);
			});
		});

		(['mouseenter', 'focusin'] as const).forEach((event) => {
			this.devOverlay!.addEventListener(event, () => {
				this.clearDelayedHide();
				if (this.isHidden()) {
					this.setOverlayVisible(true);
				}
			});
		});

		(['mouseleave', 'focusout'] as const).forEach((event) => {
			this.devOverlay!.addEventListener(event, () => {
				this.clearDelayedHide();
				if (this.getActivePlugin() || this.isHidden()) {
					return;
				}
				this.triggerDelayedHide();
			});
		});

		document.addEventListener('keyup', (event) => {
			if (event.key !== 'Escape') return;
			if (this.isHidden()) return;
			const activePlugin = this.getActivePlugin();
			if (activePlugin) {
				this.togglePluginStatus(activePlugin);
			} else {
				this.setOverlayVisible(false);
			}
		});
	}

	async initPlugin(plugin: DevOverlayPlugin) {
		const shadowRoot = this.getPluginCanvasById(plugin.id)!.shadowRoot!;
		plugin.status = 'loading';
		try {
			if (settings.config.verbose) console.info(`Initializing plugin ${plugin.id}`);

			await plugin.init?.(shadowRoot, plugin.eventTarget);
			plugin.status = 'ready';

			if (import.meta.hot) {
				import.meta.hot.send(`${WS_EVENT_NAME}:${plugin.id}:initialized`);
				import.meta.hot.send(`${WS_EVENT_NAME_DEPRECATED}:${plugin.id}:initialized`);
			}
		} catch (e) {
			console.error(`Failed to init plugin ${plugin.id}, error: ${e}`);
			plugin.status = 'error';
		}
	}

	getPluginTemplate(plugin: DevOverlayPlugin) {
		return `<button class="item" data-plugin-id="${plugin.id}">
				<div class="icon">${getPluginIcon(plugin.icon)}<div class="notification"></div></div>
				<span class="item-tooltip">${plugin.name}</span>
			</button>`;
	}

	getPluginById(id: string) {
		return this.plugins.find((plugin) => plugin.id === id);
	}

	getPluginCanvasById(id: string) {
		return this.shadowRoot.querySelector<HTMLElement>(
			`astro-dev-toolbar-plugin-canvas[data-plugin-id="${id}"]`
		);
	}

	async togglePluginStatus(plugin: DevOverlayPlugin) {
		const activePlugin = this.getActivePlugin();
		if (activePlugin) {
			const closePlugin = await this.setPluginStatus(activePlugin, false);

			// If the plugin returned false, don't open the new plugin, the old plugin didn't want to close
			if (!closePlugin) return;
		}

		// TODO(fks): Handle a plugin that hasn't loaded yet.
		// Currently, this will just do nothing.
		if (plugin.status !== 'ready') return;

		// Open the selected plugin. If the selected plugin was
		// already the active plugin then the desired outcome
		// was to close that plugin, so no action needed.
		if (plugin !== activePlugin) {
			await this.setPluginStatus(plugin, true);
		}
	}

	async setPluginStatus(plugin: DevOverlayPlugin, newStatus: boolean) {
		const pluginCanvas = this.getPluginCanvasById(plugin.id);
		if (!pluginCanvas) return false;

		if (plugin.active && !newStatus && plugin.beforeTogglingOff) {
			const shouldToggleOff = await plugin.beforeTogglingOff(pluginCanvas.shadowRoot!);

			// If the plugin returned false, don't toggle it off, maybe the plugin showed a confirmation dialog or similar
			if (!shouldToggleOff) return false;
		}

		plugin.active = newStatus ?? !plugin.active;
		const mainBarButton = this.shadowRoot.querySelector(`[data-plugin-id="${plugin.id}"]`);
		const moreBarButton = this.getPluginCanvasById('astro:more')?.shadowRoot?.querySelector(
			`[data-plugin-id="${plugin.id}"]`
		);

		if (mainBarButton) {
			mainBarButton.classList.toggle('active', plugin.active);
		}

		if (moreBarButton) {
			moreBarButton.classList.toggle('active', plugin.active);
		}

		if (plugin.active) {
			pluginCanvas.style.display = 'block';
			pluginCanvas.setAttribute('data-active', '');
		} else {
			pluginCanvas.style.display = 'none';
			pluginCanvas.removeAttribute('data-active');
		}

		[
			'app-toggled',
			// Deprecated
			'plugin-toggled',
		].forEach((eventName) => {
			plugin.eventTarget.dispatchEvent(
				new CustomEvent(eventName, {
					detail: {
						state: plugin.active,
						plugin,
					},
				})
			);
		});

		if (import.meta.hot) {
			import.meta.hot.send(`${WS_EVENT_NAME}:${plugin.id}:toggled`, { state: plugin.active });
			import.meta.hot.send(`${WS_EVENT_NAME_DEPRECATED}:${plugin.id}:toggled`, {
				state: plugin.active,
			});
		}

		return true;
	}

	isHidden(): boolean {
		return this.devOverlay?.hasAttribute('data-hidden') ?? true;
	}

	getActivePlugin(): DevOverlayPlugin | undefined {
		return this.plugins.find((plugin) => plugin.active);
	}

	clearDelayedHide() {
		window.clearTimeout(this.delayedHideTimeout);
		this.delayedHideTimeout = undefined;
	}

	triggerDelayedHide() {
		this.clearDelayedHide();
		this.delayedHideTimeout = window.setTimeout(() => {
			this.setOverlayVisible(false);
			this.delayedHideTimeout = undefined;
		}, HOVER_DELAY);
	}

	setOverlayVisible(newStatus: boolean) {
		const barContainer = this.shadowRoot.querySelector<HTMLDivElement>('#bar-container');
		const devBar = this.shadowRoot.querySelector<HTMLDivElement>('#dev-bar');
		const devBarHitboxAbove =
			this.shadowRoot.querySelector<HTMLDivElement>('#dev-bar-hitbox-above');
		if (newStatus === true) {
			this.devOverlay?.removeAttribute('data-hidden');
			barContainer?.removeAttribute('inert');
			devBar?.removeAttribute('tabindex');
			if (devBarHitboxAbove) devBarHitboxAbove.style.height = '0';
			return;
		}
		if (newStatus === false) {
			this.devOverlay?.setAttribute('data-hidden', '');
			barContainer?.setAttribute('inert', '');
			devBar?.setAttribute('tabindex', '0');
			if (devBarHitboxAbove) devBarHitboxAbove.style.height = `${DEVBAR_HITBOX_ABOVE}px`;
			return;
		}
	}

	setNotificationVisible(newStatus: boolean) {
		const devOverlayElement = this.shadowRoot.querySelector<HTMLDivElement>('#dev-overlay');
		devOverlayElement?.toggleAttribute('data-no-notification', !newStatus);

		const moreCanvas = this.getPluginCanvasById('astro:more');
		moreCanvas?.shadowRoot
			?.querySelector('#dropdown')
			?.toggleAttribute('data-no-notification', !newStatus);
	}
}

export class DevOverlayCanvas extends HTMLElement {
	shadowRoot: ShadowRoot;

	constructor() {
		super();
		this.shadowRoot = this.attachShadow({ mode: 'open' });
	}

	connectedCallback() {
		this.shadowRoot.innerHTML = `
		<style>
			:host {
				position: absolute;
				top: 0;
				left: 0;
			}
		</style>`;
	}
}

export function getPluginIcon(icon: Icon) {
	if (isDefinedIcon(icon)) {
		return getIconElement(icon).outerHTML;
	}

	return icon;
}

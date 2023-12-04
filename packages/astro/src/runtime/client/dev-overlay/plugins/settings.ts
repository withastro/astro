import type { DevOverlayPlugin } from '../../../../@types/astro.js';
import { settings, type Settings } from '../settings.js';
import { createWindowElement } from './utils/window.js';

interface SettingRow {
	name: string;
	description: string;
	input: 'checkbox' | 'text' | 'number' | 'select';
	settingKey: keyof Settings;
	changeEvent: (evt: Event) => void;
}

const settingsRows = [
	{
		name: 'Disable notifications',
		description: 'Hide notification badges in the toolbar.',
		input: 'checkbox',
		settingKey: 'disablePluginNotification',
		changeEvent: (evt: Event) => {
			if (evt.currentTarget instanceof HTMLInputElement) {
				const devOverlay = document.querySelector('astro-dev-toolbar');

				if (devOverlay) {
					devOverlay.setNotificationVisible(!evt.currentTarget.checked);
				}

				settings.updateSetting('disablePluginNotification', evt.currentTarget.checked);
				const action = evt.currentTarget.checked ? 'enabled' : 'disabled';
				settings.log(`Plugin notification badges ${action}`);
			}
		},
	},
	{
		name: 'Verbose logging',
		description: 'Logs dev overlay events in the browser console.',
		input: 'checkbox',
		settingKey: 'verbose',
		changeEvent: (evt: Event) => {
			if (evt.currentTarget instanceof HTMLInputElement) {
				settings.updateSetting('verbose', evt.currentTarget.checked);
				const action = evt.currentTarget.checked ? 'enabled' : 'disabled';
				settings.log(`Verbose logging ${action}`);
			}
		},
	},
] satisfies SettingRow[];

export default {
	id: 'astro:settings',
	name: 'Settings',
	icon: 'gear',
	init(canvas) {
		createSettingsWindow();

		document.addEventListener('astro:after-swap', createSettingsWindow);

		function createSettingsWindow() {
			const windowElement = createWindowElement(
				`<style>
					:host astro-dev-toolbar-window {
						height: 480px;

						--color-purple: rgba(224, 204, 250, 1);
					}
					header {
						display: flex;
					}

					h2, h3 {
						margin-top: 0;
					}

					.setting-row {
						display: flex;
						justify-content: space-between;
						align-items: center;
					}

					h3 {
						font-size: 16px;
						font-weight: 400;
						color: white;
						margin-bottom: 0;
					}

					label {
						font-size: 14px;
						line-height: 1.5rem;
					}

					h1 {
						display: flex;
						align-items: center;
						gap: 8px;
						font-weight: 600;
						color: #fff;
						margin: 0;
						font-size: 22px;
					}

					astro-dev-toolbar-icon {
						width: 1em;
   					height: 1em;
    				display: block;
					}

					code {
						color: var(--color-purple);
						border-color: #343841;
						border-style: solid;
						border-width: 1px;
						border-radius: .4em;
						background-color: #24262D;
						padding: .3em;
					}

					p {
						line-height: 2em;
					}

					a, a:visited {
						color: var(--color-purple);
					}
				</style>
				<header>
					<h1><astro-dev-toolbar-icon icon="gear"></astro-dev-toolbar-icon> Settings</h1>
				</header>

				<hr />

				<h2 id="general">General</h2>
				<hr />
				<h3>Hide overlay</h3>
				<p>Run <code>astro preferences disable devToolbar</code> in your terminal to disable this dev overlay in this project. <a href="https://docs.astro.build/en/reference/cli-reference/#astro-preferences">Learn more</a>.</p>
				`
			);
			const general = windowElement.querySelector('#general')!;
			for (const settingsRow of settingsRows) {
				general.after(getElementForSettingAsString(settingsRow));
				general.after(document.createElement('hr'));
			}
			canvas.append(windowElement);

			function getElementForSettingAsString(setting: SettingRow) {
				const label = document.createElement('label');
				label.classList.add('setting-row');
				const section = document.createElement('section');
				section.innerHTML = `<h3>${setting.name}</h3>${setting.description}`;
				label.append(section);

				switch (setting.input) {
					case 'checkbox': {
						const astroToggle = document.createElement('astro-dev-toolbar-toggle');
						astroToggle.input.addEventListener('change', setting.changeEvent);
						astroToggle.input.checked = settings.config[setting.settingKey];
						label.append(astroToggle);
					}
				}

				return label;
			}
		}
	},
} satisfies DevOverlayPlugin;

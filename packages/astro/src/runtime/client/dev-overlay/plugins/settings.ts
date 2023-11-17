import type { DevOverlayPlugin } from '../../../../@types/astro.js';
import { settings, type Settings } from '../settings.js';
import { createWindowWithTransition, waitForTransition } from './utils/window.js';

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
		description: 'Notification bubbles will not be shown when this is enabled.',
		input: 'checkbox',
		settingKey: 'disablePluginNotification',
		changeEvent: (evt: Event) => {
			if (evt.currentTarget instanceof HTMLInputElement) {
				settings.updateSetting('disablePluginNotification', evt.currentTarget.checked);
			}
		},
	},
	{
		name: 'Verbose logging',
		description: 'Log additional information to the console.',
		input: 'checkbox',
		settingKey: 'verbose',
		changeEvent: (evt: Event) => {
			if (evt.currentTarget instanceof HTMLInputElement) {
				settings.updateSetting('verbose', evt.currentTarget.checked);
			}
		},
	},
] satisfies SettingRow[];

export default {
	id: 'astro:settings',
	name: 'Overlay settings',
	icon: 'gear',
	init(canvas) {
		createSettingsWindow();

		document.addEventListener('astro:after-swap', createSettingsWindow);

		function createSettingsWindow() {
			const window = createWindowWithTransition(
				'Settings',
				'gear',
				`<style>
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
						font-size: 15px;
						line-height: 1.5rem;
					}
				</style>
				<h2>General</h2>
				`,
				settingsRows.flatMap((setting) => [
					getElementForSettingAsString(setting),
					document.createElement('hr'),
				])
			);
			canvas.append(window);

			function getElementForSettingAsString(setting: SettingRow) {
				const label = document.createElement('label');
				label.classList.add('setting-row');
				const section = document.createElement('section');
				section.innerHTML = `<h3>${setting.name}</h3>${setting.description}`;
				label.append(section);

				switch (setting.input) {
					case 'checkbox': {
						const astroToggle = document.createElement('astro-dev-overlay-toggle');
						astroToggle.input.addEventListener('change', setting.changeEvent);
						astroToggle.input.checked = settings.config[setting.settingKey];
						label.append(astroToggle);
					}
				}

				return label;
			}
		}
	},
	async beforeTogglingOff(canvas) {
		return await waitForTransition(canvas);
	},
} satisfies DevOverlayPlugin;

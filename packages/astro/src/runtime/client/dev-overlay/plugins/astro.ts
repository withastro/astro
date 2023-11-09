import type { DevOverlayPlugin } from '../../../../@types/astro.js';
import { createWindowWithTransition, waitForTransition } from './utils/window.js';

export default {
	id: 'astro',
	name: 'Astro',
	icon: 'astro:logo',
	init(canvas) {
		createWindow();

		document.addEventListener('astro:after-swap', createWindow);

		function createWindow() {
			const window = createWindowWithTransition(
				'Astro',
				'astro:logo',
				`<style>
				#buttons-container {
					display: flex;
					gap: 16px;
					justify-content: center;
				}

				#buttons-container astro-dev-overlay-card {
					flex: 1;
				}

				footer {
					display: flex;
					justify-content: center;
					gap: 24px;
				}

				footer a {
					color: rgba(145, 152, 173, 1);
				}

				footer a:hover {
					color: rgba(204, 206, 216, 1);
				}

				#main-container {
					display: flex;
					flex-direction: column;
					justify-content: space-between;
					height: 100%;
				}

				p {
					margin-top: 0;
				}
			</style>

			<div id="main-container">
				<div>
					<p>Welcome to Astro!</p>
					<div id="buttons-container">
						<astro-dev-overlay-card icon="bug" link="https://github.com/withastro/astro/issues/new/choose">Report an issue</astro-dev-overlay-card>
						<astro-dev-overlay-card icon="file-search" link="https://docs.astro.build/en/getting-started/">View Astro Docs</astro-dev-overlay-card>
					</div>
				</div>
				<footer>
					<a href="https://astro.build/chat" target="_blank">Join us on Discord</a>
					<a href="https://astro.build" target="_blank">Visit the Astro website</a>
				</footer>
			</div>
		`
			);

			canvas.append(window);
		}
	},
	async beforeTogglingOff(canvas) {
		return await waitForTransition(canvas);
	},
} satisfies DevOverlayPlugin;

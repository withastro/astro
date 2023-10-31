import type { DevOverlayPlugin } from '../../../../@types/astro.js';

export default {
	id: 'astro',
	name: 'Astro',
	icon: 'astro:logo',
	init(canvas) {
		const astroWindow = document.createElement('astro-dev-overlay-window');

		astroWindow.windowTitle = 'Astro';
		astroWindow.windowIcon = 'astro:logo';

		astroWindow.innerHTML = `
			<style>
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
						<astro-dev-overlay-card icon="astro:logo" link="https://github.com/withastro/astro/issues/new/choose">Report an issue</astro-dev-overlay-card>
						<astro-dev-overlay-card icon="astro:logo" link="https://docs.astro.build/en/getting-started/">View Astro Docs</astro-dev-overlay-card>
					</div>
				</div>
				<footer>
					<a href="https://discord.gg/astro" target="_blank">Join the Astro Discord</a>
					<a href="https://astro.build" target="_blank">Visit Astro.build</a>
				</footer>
			</div>
		`;

		canvas.append(astroWindow);
	},
} satisfies DevOverlayPlugin;

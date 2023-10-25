import type { DevOverlayPlugin } from '../../../../@types/astro.js';
import type { DevOverlayWindow } from '../ui-library/window.js';

const icon =
	'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 85 107"><path fill="#fff" d="M27.6 91.1c-4.8-4.4-6.3-13.7-4.2-20.4 3.5 4.2 8.3 5.6 13.3 6.3 7.7 1.2 15.3.8 22.5-2.8l2.5-1.4c.7 2 .9 3.9.6 5.9-.6 4.9-3 8.7-6.9 11.5-1.5 1.2-3.2 2.2-4.8 3.3-4.9 3.3-6.2 7.2-4.4 12.9l.2.6a13 13 0 0 1-5.7-5 13.8 13.8 0 0 1-2.2-7.4c0-1.3 0-2.7-.2-4-.5-3.1-2-4.6-4.8-4.7a5.5 5.5 0 0 0-5.7 4.6l-.2.6Z"/><path fill="url(#a)" d="M27.6 91.1c-4.8-4.4-6.3-13.7-4.2-20.4 3.5 4.2 8.3 5.6 13.3 6.3 7.7 1.2 15.3.8 22.5-2.8l2.5-1.4c.7 2 .9 3.9.6 5.9-.6 4.9-3 8.7-6.9 11.5-1.5 1.2-3.2 2.2-4.8 3.3-4.9 3.3-6.2 7.2-4.4 12.9l.2.6a13 13 0 0 1-5.7-5 13.8 13.8 0 0 1-2.2-7.4c0-1.3 0-2.7-.2-4-.5-3.1-2-4.6-4.8-4.7a5.5 5.5 0 0 0-5.7 4.6l-.2.6Z"/><path fill="#fff" d="M0 69.6s14.3-7 28.7-7l10.8-33.5c.4-1.6 1.6-2.7 3-2.7 1.2 0 2.4 1.1 2.8 2.7l10.9 33.5c17 0 28.6 7 28.6 7L60.5 3.2c-.7-2-2-3.2-3.5-3.2H27.8c-1.6 0-2.7 1.3-3.4 3.2L0 69.6Z"/><defs><linearGradient id="a" x1="22.5" x2="69.1" y1="107" y2="84.9" gradientUnits="userSpaceOnUse"><stop stop-color="#D83333"/><stop offset="1" stop-color="#F041FF"/></linearGradient></defs></svg>';

export default {
	id: 'astro',
	name: 'Astro',
	icon: icon,
	init(canvas) {
		const astroWindow = document.createElement('astro-overlay-window') as DevOverlayWindow;

		astroWindow.windowTitle = 'Astro';
		astroWindow.windowIcon = 'astro:logo';

		astroWindow.innerHTML = `
			<style>
				#buttons-container {
					display: flex;
					gap: 16px;
					justify-content: center;
				}

				#buttons-container astro-overlay-card {
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
						<astro-overlay-card icon="astro:logo" link="https://github.com/withastro/astro/issues/new/choose">Report an issue</astro-overlay-card>
						<astro-overlay-card icon="astro:logo" link="https://docs.astro.build/en/getting-started/">View Astro Docs</astro-overlay-card>
					</div>
				</div>
				<footer>
					<a href="https://discord.gg/astro" target="_blank">Join the Astro Discord</a>
					<a href="https://astro.build" target="_blank">Visit Astro.build</a>
				</footer>
			</div>
		`;

		canvas.appendChild(astroWindow);
	},
} satisfies DevOverlayPlugin;

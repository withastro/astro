import type { DevOverlayPlugin } from '../../../../@types/astro.js';
import type { DevOverlayWindow } from '../ui-library/window.js';

const icon =
	'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 24"><path fill="#fff" d="M6.45385 20.9419c-1.08694-.9911-1.40425-3.0736-.9514-4.5823.78522.9512 1.8732 1.2525 3.00013 1.4226 1.73972.2625 3.44832.1643 5.06442-.6289.1849-.0908.3557-.2115.5578-.3338.1516.4388.1911.8819.1381 1.3328-.1288 1.0982-.6767 1.9465-1.5481 2.5896-.3485.2572-.7172.4871-1.0771.7297-1.1056.7454-1.4047 1.6194-.9893 2.8909.0099.0309.0187.0619.041.1375-.5645-.252-.9768-.6189-1.29099-1.1013-.33185-.5092-.48972-1.0725-.49803-1.682-.00416-.2966-.00416-.5958-.04414-.8882-.09764-.7129-.43312-1.032-1.06513-1.0504-.64864-.0189-1.16173.3811-1.29779 1.011-.01039.0483-.02545.0961-.04051.1523l.00104.0005Z"/><path fill="url(#a)" d="M6.45385 20.9419c-1.08694-.9911-1.40425-3.0736-.9514-4.5823.78522.9512 1.8732 1.2525 3.00013 1.4226 1.73972.2625 3.44832.1643 5.06442-.6289.1849-.0908.3557-.2115.5578-.3338.1516.4388.1911.8819.1381 1.3328-.1288 1.0982-.6767 1.9465-1.5481 2.5896-.3485.2572-.7172.4871-1.0771.7297-1.1056.7454-1.4047 1.6194-.9893 2.8909.0099.0309.0187.0619.041.1375-.5645-.252-.9768-.6189-1.29099-1.1013-.33185-.5092-.48972-1.0725-.49803-1.682-.00416-.2966-.00416-.5958-.04414-.8882-.09764-.7129-.43312-1.032-1.06513-1.0504-.64864-.0189-1.16173.3811-1.29779 1.011-.01039.0483-.02545.0961-.04051.1523l.00104.0005Z"/><path fill="#fff" d="M.25 16.1083s3.21861-1.5641 6.44622-1.5641l2.43351-7.51249c.0911-.36331.35712-.61021.65744-.61021.30033 0 .56633.2469.65743.61021l2.4335 7.51249c3.8226 0 6.4462 1.5641 6.4462 1.5641s-5.467-14.85637-5.4777-14.88618C13.6897.782887 13.4248.5 13.0676.5H6.50726c-.35713 0-.61133.282887-.77893.72212C5.71652 1.25137.25 16.1083.25 16.1083Z"/><defs><linearGradient id="a" x1="9.7873" x2="12.2634" y1="23.3025" y2="15.1217" gradientUnits="userSpaceOnUse"><stop stop-color="#D83333"/><stop offset="1" stop-color="#F041FF"/></linearGradient></defs></svg>';

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

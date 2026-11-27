import { expect } from '@playwright/test';
import { type PreviewServer, testFactory } from './test-utils.ts';

const test = testFactory(import.meta.url, {
	root: './fixtures/react-component/',
	outDir: './dist/react-hydration-navigation/',
});

let server: PreviewServer;
test.beforeAll(async ({ astro }) => {
	await astro.build();
	server = await astro.preview();
});
test.afterAll(async () => {
	await server?.stop();
});

test('leaves a React island without a hydration error', async ({ astro, page }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.addInitScript(() => {
		const pendingTasks: (() => void)[] = [];
		let phase: 'entering' | 'returning' | 'restored' = 'entering';

		// Hold React's scheduler callbacks while the Astro router processes Back.
		window.MessageChannel = class extends MessageChannel {
			constructor() {
				super();
				this.port2.postMessage = new Proxy(this.port2.postMessage, {
					apply(post, port, args) {
						const send = () => Reflect.apply(post, port, args);
						if (phase === 'restored') send();
						else pendingTasks.push(send);
					},
				});
			}
		};

		document.addEventListener(
			'astro:hydrate',
			() => {
				if (phase !== 'entering') return;
				phase = 'returning';
				history.back();
			},
			{ capture: true },
		);
		document.addEventListener('astro:page-load', () => {
			if (phase !== 'returning' || location.pathname !== '/hydration-navigation/') return;
			phase = 'restored';
			document.documentElement.dataset.queuedTasks = String(pendingTasks.length);
			pendingTasks.splice(0).forEach((post) => post());
		});
	});

	await page.goto(astro.resolveUrl('/hydration-navigation/'));
	const link = page.getByRole('link', { name: 'Counter' });
	await link.click();
	await expect(page.locator('html')).toHaveAttribute('data-queued-tasks', /^[1-9]\d*$/);
	await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();

	await link.click();
	await page.getByRole('button', { name: 'Count: 0' }).click();
	await expect(page.getByRole('button', { name: 'Count: 1' })).toBeVisible();
	expect(errors).toEqual([]);
});

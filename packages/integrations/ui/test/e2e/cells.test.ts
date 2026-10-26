import { expect, type Page } from '@playwright/test';
import { prepareTestFactory } from './test-utils.ts';

// 7GUIs Cells: https://eugenkiss.github.io/7guis/tasks#cells
const { test } = prepareTestFactory({ root: './fixtures/cells/' });

const cell = (page: Page, ref: string) => page.locator(`td[data-ref="${ref}"]`);

async function enter(page: Page, ref: string, text: string) {
	await cell(page, ref).click();
	await page.keyboard.type(text);
	await page.keyboard.press('Enter');
}

test.describe('Cells', () => {
	test('renders computed values on the server', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expect(cell(page, 'D5')).toHaveText('24.25');
		await expect(cell(page, 'D7')).toHaveText('26.19');
		await expect(cell(page, 'F20')).toHaveText('6765');
	});

	test('edits propagate through dependent cells', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await cell(page, 'B1').dblclick();
		await page.keyboard.press('Control+A');
		await page.keyboard.type('10');
		await page.keyboard.press('Enter');
		await expect(cell(page, 'D1')).toHaveText('5');
		await expect(cell(page, 'D7')).toHaveText('28.35');
		await expect(page.locator('.name')).toHaveText('B2');

		await enter(page, 'F1', '2');
		await expect(cell(page, 'F20')).toHaveText('9349');
	});

	test('detects cycles and recovers when they are broken', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await enter(page, 'H1', '=H2');
		await page.keyboard.type('=H1+1');
		await page.keyboard.press('Enter');
		await enter(page, 'H3', '=H1*2');
		await expect(cell(page, 'H1')).toHaveText('#CYCLE!');
		await expect(cell(page, 'H2')).toHaveText('#CYCLE!');
		await expect(cell(page, 'H3')).toHaveText('#CYCLE!');

		await enter(page, 'H1', '4');
		await expect(cell(page, 'H2')).toHaveText('5');
		await expect(cell(page, 'H3')).toHaveText('8');
	});

	test('shows formula errors', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await enter(page, 'I1', '=1/0');
		await page.keyboard.type('=A1+1');
		await page.keyboard.press('Enter');
		await page.keyboard.type('=foo(A1)');
		await page.keyboard.press('Enter');
		await expect(cell(page, 'I1')).toHaveText('#DIV/0!');
		await expect(cell(page, 'I2')).toHaveText('#VALUE!');
		await expect(cell(page, 'I3')).toHaveText('#NAME?');
		await expect(cell(page, 'I1')).toHaveClass(/error/);
	});

	test('edits through the formula bar and the keyboard', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await cell(page, 'D5').click();
		await expect(page.locator('.formula')).toHaveValue('=sum(D1:D3)');
		await page.locator('.formula').fill('=sum(D1:D3)*2');
		await page.keyboard.press('Enter');
		await expect(cell(page, 'D5')).toHaveText('48.5');

		await cell(page, 'A0').click();
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('ArrowDown');
		await expect(page.locator('.name')).toHaveText('B1');
		await page.keyboard.press('Delete');
		await expect(cell(page, 'B1')).toHaveText('');
		await expect(cell(page, 'D1')).toHaveText('0');

		await cell(page, 'J1').dblclick();
		await page.keyboard.type('xyz');
		await page.keyboard.press('Escape');
		await expect(cell(page, 'J1')).toHaveText('');
		await expect(page.locator('.editor')).toBeHidden();
	});
});

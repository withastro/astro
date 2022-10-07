import { test, expect } from 'vitest';
import 'cli-testing-library/extend-expect';
import { run } from './util';

test('flag', async () => {
	const { findByText } = await run('foobar --template minimal --install --git --dry-run');

	expect(await findByText('Using foobar as project directory')).toBeInTheConsole();
	expect(await findByText('Using minimal as project template')).toBeInTheConsole();
	expect(await findByText('Skipping dependency installation')).toBeInTheConsole();
	expect(await findByText('Skipping Git initialization')).toBeInTheConsole();
});

test('override', async () => {
	const { findByText } = await run('foobar --template minimal -y --dry-run')
	
	expect(await findByText('Using foobar as project directory')).toBeInTheConsole();
	expect(await findByText('Using minimal as project template')).toBeInTheConsole();
	expect(await findByText('Skipping Git initialization')).toBeInTheConsole();
})

test('select', async () => {
	const { findByText, userEvent } = await run('foobar --template minimal --dry-run')

	userEvent.keyboard('[Enter]')

	expect(await findByText('Initialize a new git repository?')).toBeInTheConsole()
})

import { test, expect } from 'vitest';
import 'cli-testing-library/extend-expect';
import { run } from './util';

test('flag', async () => {
	const { findByText } = await run('foobar --template minimal --install --dry-run');
	expect(await findByText('Launch sequence initiated.')).toBeInTheConsole();
	expect(await findByText('Using foobar as project directory')).toBeInTheConsole();
	expect(await findByText('Using minimal as project template')).toBeInTheConsole();
	expect(await findByText('Skipping dependency installation')).toBeInTheConsole();
});

test('override', async () => {
	const { findByText } = await run('foobar --template minimal -y --dry-run')
	expect(await findByText('Launch sequence initiated.')).toBeInTheConsole();
	expect(await findByText('Using foobar as project directory')).toBeInTheConsole();
	expect(await findByText('Using minimal as project template')).toBeInTheConsole();
	expect(await findByText('Skipping dependency installation')).toBeInTheConsole();
})

test('select', async () => {
	const { findByText, userEvent } = await run('foobar --template minimal --dry-run')
	expect(await findByText('Launch sequence initiated.')).toBeInTheConsole();
	expect(await findByText('Using foobar as project directory')).toBeInTheConsole();
	expect(await findByText('Using minimal as project template')).toBeInTheConsole();
	expect(await findByText('Install dependencies?')).toBeInTheConsole()

	expect(await findByText('● Yes')).toBeInTheConsole()

	userEvent.keyboard('[ArrowRight]')

	expect(await findByText('● No')).toBeInTheConsole()

	userEvent.keyboard('[ArrowLeft]')

	expect(await findByText('● Yes')).toBeInTheConsole()

	userEvent.keyboard('[Enter]')

	expect(await findByText('Initialize a new git repository?')).toBeInTheConsole()
})

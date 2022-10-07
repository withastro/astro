import { test, expect } from 'vitest';
import 'cli-testing-library/extend-expect';
import { run } from './util';

test('flag', async () => {
	const { findByText, userEvent } = await run('foobar --template minimal --typescript relaxed --dry-run');
	expect(await findByText('Launch sequence initiated.')).toBeInTheConsole();
	expect(await findByText('Using foobar as project directory')).toBeInTheConsole();
	expect(await findByText('Using minimal as project template')).toBeInTheConsole();
	await userEvent.keyboard('[Enter]');
	expect(await findByText('Initialize a new git repository?')).toBeInTheConsole();
	await userEvent.keyboard('[Enter]');
	
	expect(await findByText('Using relaxed TypeScript configuration')).toBeInTheConsole();
});

test('override', async () => {
	const { findByText } = await run('foobar --template minimal -y --dry-run');
	expect(await findByText('Launch sequence initiated.')).toBeInTheConsole();
	expect(await findByText('Using foobar as project directory')).toBeInTheConsole();
	expect(await findByText('Using minimal as project template')).toBeInTheConsole();
	expect(await findByText('Skipping TypeScript setup')).toBeInTheConsole();
});

test('select', async () => {
	const { findByText, userEvent } = await run('foobar --template minimal --dry-run');
	expect(await findByText('Launch sequence initiated.')).toBeInTheConsole();
	await userEvent.keyboard('[Enter]');
	expect(await findByText('Install dependencies?')).toBeInTheConsole();
	await userEvent.keyboard('[Enter]');
	expect(await findByText('Customize TypeScript?')).toBeInTheConsole();
	expect(await findByText('● Strict')).toBeInTheConsole();
	userEvent.keyboard('[ArrowDown]');
	expect(await findByText('● Strictest')).toBeInTheConsole();
	userEvent.keyboard('[ArrowDown]');
	expect(await findByText('● Relaxed')).toBeInTheConsole();
	userEvent.keyboard('[ArrowDown]');
	expect(await findByText("● Hmm... I'm not sure")).toBeInTheConsole();
	userEvent.keyboard('[Enter]');
	expect(await findByText('Liftoff confirmed.')).toBeInTheConsole();
});

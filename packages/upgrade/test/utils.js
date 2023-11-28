import fs from 'node:fs';
import { setStdout } from '../dist/index.js';
import stripAnsi from 'strip-ansi';

export function setup() {
	const ctx = { messages: [] };
	before(() => {
		setStdout(
			Object.assign({}, process.stdout, {
				write(buf) {
					ctx.messages.push(stripAnsi(String(buf)).trim());
					return true;
				},
			})
		);
	});
	beforeEach(() => {
		ctx.messages = [];
	});

	return {
		messages() {
			return ctx.messages;
		},
		length() {
			return ctx.messages.length;
		},
		hasMessage(content) {
			return !!ctx.messages.find((msg) => msg.includes(content));
		},
	};
}

const resetBasicFixture = async () => {
	const packagePath = new URL('./fixtures/basic/package.json', import.meta.url);
	const packageJsonData = JSON.parse(
		await fs.promises.readFile(packagePath, { encoding: 'utf-8' })
	);
	const overriddenPackageJson = Object.assign(packageJsonData, {
		dependencies: {
			astro: '1.0.0',
		},
	});

	return Promise.all([
		fs.promises.writeFile(packagePath, JSON.stringify(overriddenPackageJson, null, 2), {
			encoding: 'utf-8',
		}),
	]);
};

export const resetFixtures = () => Promise.allSettled([resetBasicFixture()]);

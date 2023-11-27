import { expect } from 'chai';
import { setup } from './utils.js';
import { install } from '../dist/index.js';

describe('install', () => {
	const fixture = setup();
	const ctx = {
		cwd: '',
		version: 'latest',
		packageManager: 'npm',
		dryRun: true,
	};

	it('up to date', async () => {
		const context = {
			...ctx,
			packages: [
				{
					name: 'astro',
					currentVersion: '1.0.0',
					targetVersion: '1.0.0',
				},
			],
		};
		await install(context);
		expect(fixture.hasMessage('◼  astro is up to date on v1.0.0')).to.be.true;
	});

	it('patch', async () => {
		const context = {
			...ctx,
			packages: [
				{
					name: 'astro',
					currentVersion: '1.0.0',
					targetVersion: '1.0.1',
				},
			],
		};
		await install(context);
		expect(fixture.hasMessage('●  astro can be updated to v1.0.1')).to.be.true;
	});

	it('minor', async () => {
		const context = {
			...ctx,
			packages: [
				{
					name: 'astro',
					currentVersion: '1.0.0',
					targetVersion: '1.2.0',
				},
			],
		};
		await install(context);
		expect(fixture.hasMessage('●  astro can be updated to v1.2.0')).to.be.true;
	});

	it('major (reject)', async () => {
		let prompted = false;
		let exitCode;
		const context = {
			...ctx,
			prompt: () => {
				prompted = true;
				return { proceed: false };
			},
			exit: (code) => {
				exitCode = code;
			},
			packages: [
				{
					name: 'astro',
					currentVersion: '1.0.0',
					targetVersion: '2.0.0',
					isMajor: true,
					changelogTitle: 'CHANGELOG',
					changelogURL: 'https://example.com',
				},
			],
		};
		await install(context);
		expect(fixture.hasMessage('▲  astro can be updated to  v2.0.0')).to.be.true;
		expect(prompted).to.be.true;
		expect(exitCode).to.eq(0);
		expect(fixture.hasMessage('check   Be sure to follow the CHANGELOG.')).to.be.false;
	});

	it('major (accept)', async () => {
		let prompted = false;
		let exitCode;
		const context = {
			...ctx,
			prompt: () => {
				prompted = true;
				return { proceed: true };
			},
			exit: (code) => {
				exitCode = code;
			},
			packages: [
				{
					name: 'astro',
					currentVersion: '1.0.0',
					targetVersion: '2.0.0',
					isMajor: true,
					changelogTitle: 'CHANGELOG',
					changelogURL: 'https://example.com',
				},
			],
		};
		await install(context);
		expect(fixture.hasMessage('▲  astro can be updated to  v2.0.0')).to.be.true;
		expect(prompted).to.be.true;
		expect(exitCode).to.be.undefined;
		expect(fixture.hasMessage('check   Be sure to follow the CHANGELOG.')).to.be.true;
	});

	it('multiple major', async () => {
		let prompted = false;
		let exitCode;
		const context = {
			...ctx,
			prompt: () => {
				prompted = true;
				return { proceed: true };
			},
			exit: (code) => {
				exitCode = code;
			},
			packages: [
				{
					name: 'a',
					currentVersion: '1.0.0',
					targetVersion: '2.0.0',
					isMajor: true,
					changelogTitle: 'CHANGELOG',
					changelogURL: 'https://example.com',
				},
				{
					name: 'b',
					currentVersion: '6.0.0',
					targetVersion: '7.0.0',
					isMajor: true,
					changelogTitle: 'CHANGELOG',
					changelogURL: 'https://example.com',
				},
			],
		};
		await install(context);
		expect(fixture.hasMessage('▲  a can be updated to  v2.0.0')).to.be.true;
		expect(fixture.hasMessage('▲  b can be updated to  v7.0.0')).to.be.true;
		expect(prompted).to.be.true;
		expect(exitCode).to.be.undefined;
		const [changelog, a, b] = fixture.messages().slice(-5);
		expect(changelog).to.match(/^check/);
		expect(a).to.match(/^a/);
		expect(b).to.match(/^b/);
	});

	it('current patch minor major', async () => {
		let prompted = false;
		let exitCode;
		const context = {
			...ctx,
			prompt: () => {
				prompted = true;
				return { proceed: true };
			},
			exit: (code) => {
				exitCode = code;
			},
			packages: [
				{
					name: 'current',
					currentVersion: '1.0.0',
					targetVersion: '1.0.0',
				},
				{
					name: 'patch',
					currentVersion: '1.0.0',
					targetVersion: '1.0.1',
				},
				{
					name: 'minor',
					currentVersion: '1.0.0',
					targetVersion: '1.2.0',
				},
				{
					name: 'major',
					currentVersion: '1.0.0',
					targetVersion: '3.0.0',
					isMajor: true,
					changelogTitle: 'CHANGELOG',
					changelogURL: 'https://example.com',
				},
			],
		};
		await install(context);
		expect(fixture.hasMessage('◼  current is up to date on v1.0.0')).to.be.true;
		expect(fixture.hasMessage('●  patch can be updated to v1.0.1')).to.be.true;
		expect(fixture.hasMessage('●  minor can be updated to v1.2.0')).to.be.true;
		expect(fixture.hasMessage('▲  major can be updated to  v3.0.0')).to.be.true;
		expect(prompted).to.be.true;
		expect(exitCode).to.be.undefined;
		expect(fixture.hasMessage('check   Be sure to follow the CHANGELOG.')).to.be.true;
		const [changelog, major] = fixture.messages().slice(-4);
		expect(changelog).to.match(/^check/);
		expect(major).to.match(/^major/);
	});
});

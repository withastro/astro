import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { astroCli } from './_test-utils.js';

const root = new URL('./fixtures/dev-runtime-pages/', import.meta.url);
describe('DevRuntimePages', () => {
	let cli;
	before(async () => {
		cli = astroCli(fileURLToPath(root), 'dev', '--host', '127.0.0.1');
		await new Promise((resolve) => {
			cli.stdout.on('data', (data) => {
				if (data.includes('http://127.0.0.1:4321/')) {
					resolve();
				}
			});
		});
	});

	after((done) => {
		cli.kill();
		setTimeout(() => {
			console.log('CLEANED');
			done();
		}, 1000);
	});

	it('exists', async () => {
		const res = await fetch('http://127.0.0.1:4321/');
		const html = await res.text();
		const $ = cheerio.load(html);
		expect($('#hasRuntime').text()).to.contain('true');
	});

	it('adds cf object', async () => {
		const res = await fetch('http://127.0.0.1:4321/');
		const html = await res.text();
		const $ = cheerio.load(html);
		expect($('#hasCF').text()).to.equal('true');
	});

	it('adds cache mocking', async () => {
		const res = await fetch('http://127.0.0.1:4321/caches');
		const html = await res.text();
		const $ = cheerio.load(html);
		expect($('#hasCACHE').text()).to.equal('true');
	});

	it('adds D1 mocking', async () => {
		const res = await fetch('http://127.0.0.1:4321/d1');
		const html = await res.text();
		const $ = cheerio.load(html);
		expect($('#hasDB').text()).to.equal('true');
		expect($('#hasPRODDB').text()).to.equal('true');
		expect($('#hasACCESS').text()).to.equal('true');
	});

	it('adds R2 mocking', async () => {
		const res = await fetch('http://127.0.0.1:4321/r2');
		const html = await res.text();
		const $ = cheerio.load(html);
		expect($('#hasBUCKET').text()).to.equal('true');
		expect($('#hasPRODBUCKET').text()).to.equal('true');
		expect($('#hasACCESS').text()).to.equal('true');
	});

	it('adds KV mocking', async () => {
		const res = await fetch('http://127.0.0.1:4321/kv');
		const html = await res.text();
		const $ = cheerio.load(html);
		expect($('#hasKV').text()).to.equal('true');
		expect($('#hasPRODKV').text()).to.equal('true');
		expect($('#hasACCESS').text()).to.equal('true');
	});

	it('adds DO mocking', async () => {
		const res = await fetch('http://127.0.0.1:4321/do');
		const html = await res.text();
		const $ = cheerio.load(html);
		expect($('#hasDO').text()).to.equal('true');
	});
});

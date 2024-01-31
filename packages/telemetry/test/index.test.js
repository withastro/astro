import { expect } from 'chai';
import { AstroTelemetry } from '../dist/index.js';

function setup() {
	const config = new Map();
	const telemetry = new AstroTelemetry({ version: '0.0.0-test.1' });
	const logs = [];
	// Stub isCI to false so we can test user-facing behavior
	telemetry.isCI = false;
	// Stub process.env to properly test in Astro's own CI
	telemetry.env = {};
	// Override config so we can inspect it
	telemetry.config = config;
	// Override debug so we can inspect it
	telemetry.debug.enabled = true;
	telemetry.debug.log = (...args) => logs.push(args);

	return { telemetry, config, logs };
}
describe('AstroTelemetry', () => {
	let oldCI;
	before(() => {
		oldCI = process.env.CI;
		// Stub process.env.CI to `false`
		process.env.CI = 'false';
	});
	after(() => {
		process.env.CI = oldCI;
	});
	it('initializes when expected arguments are given', () => {
		const { telemetry } = setup();
		expect(telemetry).to.be.instanceOf(AstroTelemetry);
	});
	it('does not record event if disabled', async () => {
		const { telemetry, config, logs } = setup();
		telemetry.setEnabled(false);
		const [key] = Array.from(config.keys());
		expect(key).not.to.be.undefined;
		expect(config.get(key)).to.be.false;
		expect(telemetry.enabled).to.be.false;
		expect(telemetry.isDisabled).to.be.true;
		const result = await telemetry.record(['TEST']);
		expect(result).to.be.undefined;
		const [log] = logs;
		expect(log).not.to.be.undefined;
		expect(logs.join('')).to.match(/disabled/);
	});
	it('records event if enabled', async () => {
		const { telemetry, config, logs } = setup();
		telemetry.setEnabled(true);
		const [key] = Array.from(config.keys());
		expect(key).not.to.be.undefined;
		expect(config.get(key)).to.be.true;
		expect(telemetry.enabled).to.be.true;
		expect(telemetry.isDisabled).to.be.false;
		await telemetry.record(['TEST']);
		expect(logs.length).to.equal(2);
	});
	it('respects disable from notify', async () => {
		const { telemetry, config, logs } = setup();
		await telemetry.notify(() => false);
		const [key] = Array.from(config.keys());
		expect(key).not.to.be.undefined;
		expect(config.get(key)).to.be.false;
		expect(telemetry.enabled).to.be.false;
		expect(telemetry.isDisabled).to.be.true;
		const [log] = logs;
		expect(log).not.to.be.undefined;
		expect(logs.join('')).to.match(/disabled/);
	});
	it('respects enable from notify', async () => {
		const { telemetry, config, logs } = setup();
		await telemetry.notify(() => true);
		const [key] = Array.from(config.keys());
		expect(key).not.to.be.undefined;
		expect(config.get(key)).to.be.true;
		expect(telemetry.enabled).to.be.true;
		expect(telemetry.isDisabled).to.be.false;
		const [log] = logs;
		expect(log).not.to.be.undefined;
		expect(logs.join('')).to.match(/enabled/);
	});
});

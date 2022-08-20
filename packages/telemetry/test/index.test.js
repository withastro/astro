import { expect } from 'chai';
import fetch from 'node-fetch';

import { AstroTelemetry } from '../dist/index.js';

describe('AstroTelemetry', () => {
	it('initializes when expected arguments are given', () => {
		const telemetry = new AstroTelemetry({ version: '0.0.0-test.1' });
		expect(telemetry).to.be.instanceOf(AstroTelemetry);
	});

	it('drops recording request if disabled', async () => {
		const telemetry = new AstroTelemetry({ version: '0.0.0-test.1' });
		telemetry.setEnabled(false);
		telemetry.record([{}]);

		expect(fetch.called).to.equal(false);
	});
});

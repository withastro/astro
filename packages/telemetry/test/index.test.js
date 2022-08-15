import { expect } from 'chai';
import * as td from 'testdouble';

describe('AstroTelemetry', () => {
	let postModuleMock;
	let AstroTelemetry;

	beforeEach(async () => {
		postModuleMock = await td.replaceEsm('../dist/post.js');

		AstroTelemetry = (await import('../dist/index.js')).AstroTelemetry;
	});

	it('initializes when expected arguments are given', () => {
		const telemetry = new AstroTelemetry({ version: '0.0.0-test.1' });
		expect(telemetry).to.be.instanceOf(AstroTelemetry);
	});

	it('drops recording request if disabled', () => {
		td.when(postModuleMock.post(td.matchers.anything())).thenResolve();

		const telemetry = new AstroTelemetry({ version: '0.0.0-test.1' });
		telemetry.setEnabled(false);
		telemetry.record([{}]);

		td.verify(postModuleMock.post(), { times: 0, ignoreExtraArgs: true });
	});
});

import { expect } from 'chai';
import {AstroTelemetry} from '../dist/index.js';

describe('AstroTelemetry', () => {
	it('initializes when expected arguments are given', () => {
        const telemetry = new AstroTelemetry({ version: '0.0.0-test.1' });
        expect(telemetry).to.be.instanceOf(AstroTelemetry);
	});
});

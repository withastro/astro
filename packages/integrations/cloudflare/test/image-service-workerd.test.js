import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import service from '../dist/entrypoints/image-service-workerd.js';

/** Extract the fields that hashTransform uses — mirrors its reduce logic. */
function extractHashFields(transform, propertiesToHash) {
	return propertiesToHash.reduce((acc, prop) => {
		acc[prop] = transform[prop];
		return acc;
	}, {});
}

describe('image-service-workerd', () => {
	it('service config changes produce different hash inputs', () => {
		const baseOptions = { src: '/test.jpg', width: 100, height: 100 };
		const makeImageConfig = (config) => ({
			service: { entrypoint: 'test', config },
			domains: [],
			remotePatterns: [],
		});

		const optsA = service.validateOptions(
			{ ...baseOptions },
			makeImageConfig({ defaultDitherAlgorithm: 'atkinson' }),
		);
		const optsB = service.validateOptions(
			{ ...baseOptions },
			makeImageConfig({ defaultDitherAlgorithm: 'bayer-16' }),
		);

		const fieldsA = extractHashFields(optsA, service.propertiesToHash);
		const fieldsB = extractHashFields(optsB, service.propertiesToHash);

		assert.notDeepEqual(fieldsA, fieldsB, 'hash inputs must differ when service config changes');
	});

	it('absent config does not inject _serviceConfig', () => {
		const opts = service.validateOptions(
			{ src: '/test.jpg', width: 100, height: 100 },
			{ service: { entrypoint: 'test' }, domains: [], remotePatterns: [] },
		);
		assert.equal(opts._serviceConfig, undefined);
	});
});

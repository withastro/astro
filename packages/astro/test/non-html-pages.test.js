import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Non-HTML Pages', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/non-html-pages/' });
		await fixture.build();
	});

	describe('json', () => {
		it('should match contents', async () => {
			const json = JSON.parse(await fixture.readFile('/about.json'));
			expect(json).to.have.property('name', 'Astro');
			expect(json).to.have.property('url', 'https://astro.build/');
		});

		it('should match contents (deprecated object form)', async () => {
			const json = JSON.parse(await fixture.readFile('/about-object.json'));
			expect(json).to.have.property('name', 'Astro');
			expect(json).to.have.property('url', 'https://astro.build/');
		});
	});

	describe('png', () => {
		it('should not have had its encoding mangled', async () => {
			const buffer = await fixture.readFile('/placeholder.png', 'base64');

			// Sanity check the first byte
			const hex = Buffer.from(buffer, 'base64').toString('hex');
			const firstHexByte = hex.slice(0, 2);
			// If we accidentally utf8 encode the png, the first byte (in hex) will be 'c2'
			expect(firstHexByte).to.not.equal('c2');
			// and if correctly encoded in binary, it should be '89'
			expect(firstHexByte).to.equal('89');

			// Make sure the whole buffer (in base64) matches this snapshot
			expect(buffer).to.equal(
				'iVBORw0KGgoAAAANSUhEUgAAAGQAAACWCAYAAAAouC1GAAAD10lEQVR4Xu3ZbW4iMRCE4c1RuP+ZEEfZFZHIAgHGH9Xtsv3m94yx6qHaM+HrfD7//cOfTQJfgNhYfG8EEC8PQMw8AAHELQGz/XCGAGKWgNl2aAggZgmYbYeGAGKWgNl2aAggZgmYbYeGAGKWgNl2aAggZgmYbYeGAGKWgNl2aAggZgmYbYeGAGKWgNl2aAggZgmYbYeGAGKWgNl2aAggZgmYbWe6hpxOp6oIL5dL1fWjL54CpBbhXagz4FiDqCCegZxhLEGiIGaAsQPJwrjhuLXFBiQbwrUtFiCjMZzaMhzEBcMFZSiIG4YDyjAQV4zRKENA3DFGoqSDzIIxCgWQgn9eZb6rpILM1o57qyyUNJCZMTLHFyAFI2s5kBXakYWS0hBAymsYDrISRkZLACn/8j5cGfXUFQqyYjuiWwJIY0Out0W0JAxk5XZEtgQQGtKRgOGt6rEV0pAdxlXU2AKks3U0pDPAiNuVKDREIGQNstP5EXGOyBsCSF/lAOnL7/tuRpYgRPUSKhQaIpIBRBSkahlAVEmK1gFEFKRqGUuQHR951e8i0kMdkP6+SUGu29kVxXJkAUJD+hMQrUBDREGqlgFElaRgHRXGdSsc6oAIEjBbgoYAUpfAbu8i1g3Z7V1EiRFyqANSN02er5Y/Zd0+YJexNUVDdmmJGiNsZAHSPrbCRtYOKFM1ZHWQCIzQkbX64Q5I+1iW3xmFkdKQFUcXIPLvePuCkRhpDVmpJcuArIASjZHakNmfujIwAKk4SpYFmXF0ZWEMachsoysTYyjIDE3JxhgO4owyAsMCxBFlFIYNiBPKSAxAnh57R2PYgLj9/j4SJvQXw5L3LjeM+z2PgBkG4gzx/EXKhEkHmQliRFvSQGaFyEZJAVkB4wYTPb7CQVbCyEAJA1kRImN8hYCsjhHZFDnILhhRKICUvL0eXKM86KUgu7Uj4kyRgeyMoRxfEhAw/neld3x1g4Dx+4DpQQFEcKi/WqIVpQuEdrzXTAcB47haLSjNDQHkGOR6RS1KEwgYZRgtj8PVIGDUYdS2BJD6fJvuKB1dVSC0o8ni56YSFED6Mq66WwpCO6qyf3vxEUpxQwAxAgFDg1HyGFzUEECMQMDQYhy15LAhgBiBgBGD8ent/WNDAIkDeYcCSGzmH1d/9U7yFoR25Eg9owCSk3vxmzsgM4AwrnKV7sfWy4YAAkhuAmaf9rEhtCNfC5D8zA8/8Yby6wyhIYfZhVwASEis7Yu+BKEd7YH23glIb4IB919RHs4QGhKQcsWSgFSElXEpIBkpV3zGAwjjqiK5oEsBCQq2Z9l/4WuAC09sfQEAAAAASUVORK5CYII='
			);
		});

		it('should not have had its encoding mangled (deprecated object form)', async () => {
			const buffer = await fixture.readFile('/placeholder-object.png', 'base64');

			// Sanity check the first byte
			const hex = Buffer.from(buffer, 'base64').toString('hex');
			const firstHexByte = hex.slice(0, 2);
			// If we accidentally utf8 encode the png, the first byte (in hex) will be 'c2'
			expect(firstHexByte).to.not.equal('c2');
			// and if correctly encoded in binary, it should be '89'
			expect(firstHexByte).to.equal('89');

			// Make sure the whole buffer (in base64) matches this snapshot
			expect(buffer).to.equal(
				'iVBORw0KGgoAAAANSUhEUgAAAGQAAACWCAYAAAAouC1GAAAD10lEQVR4Xu3ZbW4iMRCE4c1RuP+ZEEfZFZHIAgHGH9Xtsv3m94yx6qHaM+HrfD7//cOfTQJfgNhYfG8EEC8PQMw8AAHELQGz/XCGAGKWgNl2aAggZgmYbYeGAGKWgNl2aAggZgmYbYeGAGKWgNl2aAggZgmYbYeGAGKWgNl2aAggZgmYbYeGAGKWgNl2aAggZgmYbYeGAGKWgNl2aAggZgmYbWe6hpxOp6oIL5dL1fWjL54CpBbhXagz4FiDqCCegZxhLEGiIGaAsQPJwrjhuLXFBiQbwrUtFiCjMZzaMhzEBcMFZSiIG4YDyjAQV4zRKENA3DFGoqSDzIIxCgWQgn9eZb6rpILM1o57qyyUNJCZMTLHFyAFI2s5kBXakYWS0hBAymsYDrISRkZLACn/8j5cGfXUFQqyYjuiWwJIY0Out0W0JAxk5XZEtgQQGtKRgOGt6rEV0pAdxlXU2AKks3U0pDPAiNuVKDREIGQNstP5EXGOyBsCSF/lAOnL7/tuRpYgRPUSKhQaIpIBRBSkahlAVEmK1gFEFKRqGUuQHR951e8i0kMdkP6+SUGu29kVxXJkAUJD+hMQrUBDREGqlgFElaRgHRXGdSsc6oAIEjBbgoYAUpfAbu8i1g3Z7V1EiRFyqANSN02er5Y/Zd0+YJexNUVDdmmJGiNsZAHSPrbCRtYOKFM1ZHWQCIzQkbX64Q5I+1iW3xmFkdKQFUcXIPLvePuCkRhpDVmpJcuArIASjZHakNmfujIwAKk4SpYFmXF0ZWEMachsoysTYyjIDE3JxhgO4owyAsMCxBFlFIYNiBPKSAxAnh57R2PYgLj9/j4SJvQXw5L3LjeM+z2PgBkG4gzx/EXKhEkHmQliRFvSQGaFyEZJAVkB4wYTPb7CQVbCyEAJA1kRImN8hYCsjhHZFDnILhhRKICUvL0eXKM86KUgu7Uj4kyRgeyMoRxfEhAw/neld3x1g4Dx+4DpQQFEcKi/WqIVpQuEdrzXTAcB47haLSjNDQHkGOR6RS1KEwgYZRgtj8PVIGDUYdS2BJD6fJvuKB1dVSC0o8ni56YSFED6Mq66WwpCO6qyf3vxEUpxQwAxAgFDg1HyGFzUEECMQMDQYhy15LAhgBiBgBGD8ent/WNDAIkDeYcCSGzmH1d/9U7yFoR25Eg9owCSk3vxmzsgM4AwrnKV7sfWy4YAAkhuAmaf9rEhtCNfC5D8zA8/8Yby6wyhIYfZhVwASEis7Yu+BKEd7YH23glIb4IB919RHs4QGhKQcsWSgFSElXEpIBkpV3zGAwjjqiK5oEsBCQq2Z9l/4WuAC09sfQEAAAAASUVORK5CYII='
			);
		});
	});
});

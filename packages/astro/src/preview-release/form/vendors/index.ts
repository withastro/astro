import { type ToFormInputFn, UnsupportedVendorError, validationMapper } from './utils.js';

export const getToFormInputFn = async (vendor: string): Promise<ToFormInputFn> => {
	const cached = validationMapper.get(vendor);
	if (cached) {
		return cached;
	}

	let vendorFnPromise: ToFormInputFn | Promise<ToFormInputFn>;

	switch (vendor) {
		case 'zod':
			vendorFnPromise = (await import('./zod.js')).default();
			break;
		default:
			throw new UnsupportedVendorError(vendor);
	}

	const vendorFn = await vendorFnPromise;
	validationMapper.set(vendor, vendorFn);
	return vendorFn;
};

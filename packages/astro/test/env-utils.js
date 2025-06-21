/**
 * Utilities for managing environment variables in tests to prevent contamination
 */

/**
 * Creates a manager for temporarily setting environment variables in tests.
 * Automatically restores original values after tests complete.
 * 
 * @returns {Object} An object with methods to manage environment variables
 */
export function createEnvironmentManager() {
	const originalValues = new Map();
	
	return {
		/**
		 * Sets environment variables and stores their original values
		 * @param {Object} vars - Object with key-value pairs to set
		 */
		set(vars) {
			for (const [key, value] of Object.entries(vars)) {
				if (!originalValues.has(key)) {
					originalValues.set(key, process.env[key]);
				}
				process.env[key] = value;
			}
		},
		
		/**
		 * Restores all environment variables to their original values
		 */
		restore() {
			for (const [key, originalValue] of originalValues) {
				if (originalValue === undefined) {
					delete process.env[key];
				} else {
					process.env[key] = originalValue;
				}
			}
			originalValues.clear();
		},
		
		/**
		 * Clears specific environment variables matching a pattern
		 * @param {RegExp} pattern - Pattern to match environment variable names
		 */
		clearPattern(pattern) {
			const keys = Object.keys(process.env);
			for (const key of keys) {
				if (pattern.test(key)) {
					if (!originalValues.has(key)) {
						originalValues.set(key, process.env[key]);
					}
					delete process.env[key];
				}
			}
		}
	};
}

/**
 * Higher-order function that wraps a test function with environment isolation
 * @param {Function} testFn - The test function to wrap
 * @param {Object} envVars - Environment variables to set for the test
 * @returns {Function} Wrapped test function
 */
export function withEnvironment(testFn, envVars) {
	return async function(...args) {
		const envManager = createEnvironmentManager();
		try {
			envManager.set(envVars);
			return await testFn(...args);
		} finally {
			envManager.restore();
		}
	};
}
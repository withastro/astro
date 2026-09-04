// Shared module that will be extracted into a separate chunk
// when imported by multiple client-side scripts
export function greet(name) {
	return `Hello, ${name}!`;
}

export function farewell(name) {
	return `Goodbye, ${name}!`;
}

// Add enough code to prevent inlining
export const MESSAGES = {
	welcome: 'Welcome to the app',
	loading: 'Loading...',
	error: 'Something went wrong',
	success: 'Operation successful',
	notFound: 'Page not found',
};

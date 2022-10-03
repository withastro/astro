// tsconfig-resolver types are outdated, so unfortunately we can't use them here, annoying.
export const tsconfigsPresets = {
	vue: {
		compilerOptions: {
			jsx: 'preserve',
		},
	},
	react: {
		compilerOptions: {
			jsx: 'react-jsx',
			jsxImportSource: 'react',
		},
	},
	preact: {
		compilerOptions: {
			jsx: 'react-jsx',
			jsxImportSource: 'preact',
		},
	},
	'solid-js': {
		compilerOptions: {
			jsx: 'preserve',
			jsxImportSource: 'solid-js',
		},
	},
};

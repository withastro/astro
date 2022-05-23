import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import cleanup from 'rollup-plugin-cleanup';
import copy from 'rollup-plugin-copy';
import builtins from 'builtin-modules';

export default [
    {
        input: 'src/index.ts',
        output: [
            {
                sourcemap: false,
                format: 'cjs',
                file: 'dist/src/index.js'
            }
        ],
        plugins: [
            replace({
                // This replace-step is a hacky workaround to not transform the dynamic
                // requires inside importPackage.ts of svelte-language-server in any way
                'return require(dynamicFileToRequire);': 'return "XXXXXXXXXXXXXXXXXXXXX";',
                delimiters: ['', '']
            }),
            resolve({ browser: false, preferBuiltins: true }),
            commonjs(),
            json(),
            typescript(),
            replace({
                // This replace-step is a hacky workaround to not transform the dynamic
                // requires inside importPackage.ts of svelte-language-server in any way
                'return "XXXXXXXXXXXXXXXXXXXXX";': 'return require(dynamicFileToRequire);',
                delimiters: ['', '']
            }),
            cleanup({ comments: ['some', 'ts', 'ts3s'] }),
            copy({
                targets: [
                    // copy over d.ts files of svelte2tsx
                    {
                        src: [
                            // workspace
                            '../../node_modules/svelte2tsx/svelte*.d.ts',
                            // standalone
                            'node_modules/svelte2tsx/svelte*.d.ts'
                        ],
                        dest: 'dist/src'
                    }
                ]
            })
        ],
        watch: {
            clearScreen: false
        },
        external: [
            ...builtins,
            // svelte-check dependencies that are system-dependent and should
            // be installed as dependencies through npm
            'picocolors',
            'chokidar',
            // Dependencies of svelte-language-server
            // we don't want to bundle and instead require them as dependencies
            'typescript',
            'sade',
            'svelte',
            'svelte/compiler',
            'svelte-preprocess',
            'import-fresh', // because of https://github.com/sindresorhus/import-fresh/issues/18
            '@jridgewell/trace-mapping'
        ]
    }
];

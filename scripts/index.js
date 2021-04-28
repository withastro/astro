export default async function astroScripts(cmd, ...args) {
    switch (cmd) {
        case 'build': {
            const { default: build } = await import('./cmd/build.js');
            build(...args);
        }
        case 'test': {
            const { default: test } = await import('./cmd/test.js');
            test(...args);
        }
    }
}

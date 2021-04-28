import esbuild from 'esbuild';

export default async function build(...args) {
    esbuild.build({
        "bundle": true,
    })
}

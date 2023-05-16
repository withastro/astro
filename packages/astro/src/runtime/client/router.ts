import listen from 'micromorph/spa';

listen({
    beforeDiff(doc) {
        console.log('before diff')
    },
    afterDiff() {
        console.log('after diff')
    }
})

module.exports = function (_w) {
    return {
        files: ['src/**/*.ts'],
        tests: ['test/**/*.ts'],
        env: {
            type: 'node'
        }
    };
};

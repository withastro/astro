module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-rational-order',
    'stylelint-config-prettier',
  ],
  rules: {
    'at-rule-no-unknown': [
      true,
      { ignoreAtRules: ['use', 'each', 'for', 'mixin', 'extend', 'include'] },
    ], // allow Sass syntax,
    'no-descending-specificity': null,
  },
  syntax: 'scss',
};

const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.mocha,
      },
    },
    rules: {
      'no-unused-vars': ['error', { args: 'none', ignoreRestSiblings: true }],
    },
  },
  {
    files: ['lib/**/*.js'],
    languageOptions: { sourceType: 'module' },
  },
  {
    files: ['bin/**/*.js', 'test/**/*.js'],
    languageOptions: { sourceType: 'commonjs' },
  },
];

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  plugins: ['svelte3', '@typescript-eslint'],
  ignorePatterns: ['*.cjs'],
  overrides: [{ files: ['*.svelte'], processor: 'svelte3/svelte3' }],
  settings: {
    'svelte3/typescript': () => require('typescript')
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020
  },
  env: {
    browser: true,
    es2017: true,
    node: true
  },
  rules: {
    // indent, quotes and semi (base config)
    'indent': [
      2, 2
    ],
    'quotes': [
      2,
      'single',
      {
        'avoidEscape': false,
        'allowTemplateLiterals': true
      },
    ],
    'jsx-quotes': [
      2, 'prefer-single'
    ],
    'semi': [
      2, 'always'
    ],
    'strict': [
      2, 'global'
    ],
    'no-extra-parens': [
      2, 'all'
    ],
    'no-async-promise-executor': [0],
    'no-empty': [
      2,
      { 'allowEmptyCatch': true, },
    ],
    'default-case-last': [2],
    'default-param-last': [2],
    'no-var': [2],
    'max-classes-per-file': [
      2, 5
    ],
    'quote-props': [
      1, 'consistent-as-needed'
    ],
    'prefer-template': [2],
    'require-unicode-regexp': [1],
    'dot-notation': [
      2, {
        'allowKeywords': false,
        'allowPattern': '^[a-z]+(_[a-z]+)+$'
      }
    ],
    'eqeqeq': [
      2, 'always', { 'null': 'ignore' }
    ],
    'linebreak-style': [
      2, 'unix'
    ],
    'no-multiple-empty-lines': [
      2, {
        'max': 3, 'maxEOF': 1, 'maxBOF': 0
      }
    ],
    'newline-per-chained-call': [2],
    'eol-last': [
      2, 'always'
    ],
    'arrow-body-style': [
      2, 'as-needed'
    ],
    'prefer-arrow-callback': [2],
    'no-trailing-spaces': [2],
  }
};

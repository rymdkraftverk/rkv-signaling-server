import globals from 'globals'
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs'
import { configs, plugins } from 'eslint-config-airbnb-extended'

export default [
  { ignores: ['dist/'] },
  plugins.stylistic,
  plugins.importX,
  ...configs.base.recommended,
  comments.recommended,
  {
    name:            'rkv-signaling-server/language',
    languageOptions: {
      ecmaVersion:   'latest',
      sourceType:    'commonjs',
      parserOptions: { ecmaVersion: 'latest' },
      globals:       globals.node,
    },
  },
  {
    name:  'rkv-signaling-server/house-style',
    rules: {
      '@eslint-community/eslint-comments/no-unused-disable': 'error',
      '@stylistic/arrow-parens':                             [
        'error',
        'as-needed',
        { requireForBlockBody: true },
      ],
      '@stylistic/function-call-spacing':    ['error', 'never'],
      '@stylistic/key-spacing':              ['error', { align: 'value' }],
      '@stylistic/max-len':                  ['error', { code: 100 }],
      '@stylistic/newline-per-chained-call': ['error', { ignoreChainWithDepth: 1 }],
      '@stylistic/semi':                     ['error', 'never'],
      'func-style':                          ['error', 'expression', { allowArrowFunctions: true }],
      'import-x/prefer-default-export':      'off',
      'no-param-reassign':                   'off',
      'no-use-before-define':                'off',
    },
  },
  {
    name:            'rkv-signaling-server/config',
    files:           ['*.mjs'],
    languageOptions: { sourceType: 'module' },
  },
]

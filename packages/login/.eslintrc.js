/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.
 */
module.exports = {
  extends: ['../../.eslintrc.js', 'eslint-config-react-app'],
  plugins: ['react'],
  env: {
    es6: true,
    browser: true,
    node: true,
    jest: true
  },
  rules: {
    'react/no-unescaped-entities': 'off',
    'react/destructuring-assignment': 'off',
    'react/jsx-filename-extension': [
      1,
      {
        extensions: ['.tsx']
      }
    ],
    'react/boolean-prop-naming': 'off',
    'react/sort-comp': 'off',
    'react/sort-prop-types': 'off'
  },
  settings: {
    react: {
      pragma: 'React',
      version: 'detect'
    }
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: ['./tsconfig.json']
      }
    }
  ],
  globals: {},
  parser: '@typescript-eslint/parser'
}

module.exports = {
  /* your base configuration of choice */
  extends: ['eslint:recommended', 'plugin:react/recommended'],

  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true
  },
  globals: {
    __static: true
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    // allow anonymous component functions
    'react/display-name': 0,
    // disallow console and debugger in production mode
    'no-console': process.env.NODE_ENV === 'production' ? 2 : 0,
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    // allow spreading out properties from an object without warnings
    'no-unused-vars': [1, { ignoreRestSiblings: true }]
  }
}

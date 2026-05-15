module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'script'
  },
  rules: {
    'no-undef': 'off',
    'no-unused-vars': 'warn',
    'no-console': 'off'
  },
  globals: {
    ApplePaySession: 'readonly',
    define: 'readonly',
    module: 'readonly',
    exports: 'readonly'
  }
};

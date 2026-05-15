const { babel } = require('@rollup/plugin-babel');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const terser = require('@rollup/plugin-terser');
const { readFileSync } = require('fs');

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * Released under the ${pkg.license} License.
 */`;

const babelConfig = {
  babelHelpers: 'bundled',
  exclude: 'node_modules/**',
  presets: [
    ['@babel/preset-env', {
      targets: '> 1%, last 2 versions, not dead'
    }]
  ]
};

module.exports = [
  {
    input: 'src/vqdigitalwalletapple.js',
    output: {
      file: 'vqdigitalwalletapple.js',
      format: 'iife',
      name: 'VqDigitalWalletApple',
      banner
    },
    context: 'window',
    plugins: [nodeResolve(), babel(babelConfig)]
  },
  {
    input: 'src/vqdigitalwalletapple.js',
    output: {
      file: 'dist/vqdigitalwalletapple.min.js',
      format: 'umd',
      name: 'VqDigitalWalletApple',
      banner
    },
    context: 'window',
    plugins: [nodeResolve(), babel(babelConfig), terser()]
  }
];

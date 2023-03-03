const { merge } = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('css-minimizer-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const common = require('./webpack.common');

module.exports = merge(common, {
  mode: 'production',
  optimization: {
    minimizer: [
      new TerserPlugin({}),
      new OptimizeCSSAssetsPlugin({}),
    ],
  },
  plugins: [
    new Dotenv({ systemvars: true }),
  ],
});

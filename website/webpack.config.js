'use strict';

let webpack = require('webpack');
let path = require('path');

console.log(__dirname);

module.exports = {
  devtool: 'eval',
  output: {
    path: path.join(__dirname, 'static'),
    filename: 'bundle.js',
    publicPath: '/static/'
  },
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: [/node_modules/, /server/, /analyzer/, /db/],
      loader: 'react-hot-loader'
    }, {
      test: /\.jsx?$/,
      exclude: [/node_modules/, /server/, /analyzer/, /db/],
      loader: 'babel-loader',
      query: {
        presets: ['es2015', 'react', 'stage-1'],
        plugins: ['babel-root-import']
      }
    }, {
      test: /\.less$/,
      loader: 'style!css!less'
    }]
  },
  entry: [
    'webpack-dev-server/client?http://0.0.0.0:9901',
    'webpack/hot/only-dev-server',
    path.join(__dirname, './Root')
  ],
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ]
};

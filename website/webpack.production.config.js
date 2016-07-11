'use strict';

let webpack = require('webpack');
let path = require('path');

module.exports = {
    name: 'browser',
    output: {
        path: path.join(__dirname, 'static'),
        filename: 'bundle.js',
        publicPath: '/static/'
    },
    module: {
        loaders: [{
            test: /\.jsx?$/,
            include: [
              path.join(__dirname, 'app/'),
              path.join(__dirname, 'Root.js')
            ],
            loader: 'babel-loader',
            query: {
                presets: ['es2015', 'react',
                    'stage-1'
                ],
                plugins: ['babel-root-import']
            }
        }, {
            test: /\.less$/,
            loader: 'style!css!less'
        }, {
            loader: 'json-loader',
            test: /\.json$/
        }]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': '"production"'
        })
    ],
    entry: path.join(__dirname, './Root') // Your appʼs entry point
};

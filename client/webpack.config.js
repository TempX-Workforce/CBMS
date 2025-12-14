const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const publicPath = isProduction ? '/CBMS/' : '/';

  return {
    entry: './src/index.jsx',

    output: {
      path: path.resolve(__dirname, 'build'),
      filename: 'bundle.[contenthash].js',
      publicPath: publicPath,
      clean: true,
    },

    mode: argv.mode || 'development',

    resolve: {
      extensions: ['.js', '.jsx'],
    },

    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|svg|ico)$/i,
          type: 'asset/resource',
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: './index.html',
        publicPath: publicPath,
      }),
      new Dotenv({
        systemvars: true,
      }),
      new CopyPlugin({
        patterns: [
          { from: 'public/manifest.json', to: '' },
          { from: 'public/favicon.ico', to: '' },
          { from: 'public/logo192.png', to: '' },
          { from: 'public/logo512.png', to: '' }, // optional, if you have it
        ],
      }),
    ],

    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://fonts.gstatic.com data:; connect-src 'self' http://localhost:5000 ws://localhost:3000 https://fonts.googleapis.com https://fonts.gstatic.com https://cbms-mjcv.onrender.com;",
      },
      port: 3000,
      hot: true,
      open: true,
      historyApiFallback: true,
      proxy: [
        {
          context: ['/api'],
          target: 'https://cbms-mjcv.onrender.com',
          changeOrigin: true,
          secure: false,
          onProxyReq: (proxyReq) => {
            // Spoof the Origin header to bypass strict CORS on backend
            proxyReq.setHeader('Origin', 'https://tempx-workforce.github.io/cbms');
          },
        },
      ],
    },
  };
};

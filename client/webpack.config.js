const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.jsx',

  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.[contenthash].js',
    publicPath: '/CBMS/', // Must match your GitHub Pages repo name
    clean: true,
  },

  mode: process.env.NODE_ENV || 'development',

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
      publicPath: '/CBMS/', // ensures %PUBLIC_URL% replacement
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
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    ],
  },
};

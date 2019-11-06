const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  watch: true,

  target: "electron-renderer",
  entry: {
      bundle: "./app/src/entry.js",
  },
  mode: 'development',

  output: {
    path: __dirname + "/app/build",
    publicPath: "build/",
    filename: "[name].js"
  },

  module: {
    rules: [
      {
        test: /\.(ttf|otf|eot|svg|woff)(\?[a-z0-9]+)?$/,
        loader: "ignore-loader"
      },
      {
        test: /\.(woff2)(\?[a-z0-9]+)?$/,
        loader: "file-loader?name=fonts/[name].[ext]"
      },
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: ["@babel/plugin-transform-flow-strip-types", "@babel/plugin-proposal-class-properties"],
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      // {
      //   test: /\.css$/,
      //   loader: "css-loader"
      // },
      {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
          ],
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: "file-loader",
        query: {
          name: "[name].[ext]?[hash]"
        }
      }
    ]
  },

  plugins: [
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // all options are optional
      filename: '[name].css',
      chunkFilename: '[id].css',
      ignoreOrder: false, // Enable to remove warnings about conflicting order
    }),
  ],

  // plugins: [
  //     new ExtractTextPlugin({
  //         filename: 'bundle.css',
  //         disable: false,
  //         allChunks: true
  //     }
  // )
  // ]
};

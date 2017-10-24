const ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = {
    watch: true,

    target: 'electron-renderer',
    entry: './app/src/entry.js',

    output: {
        path: __dirname + '/app/build',
        publicPath: 'build/',
        filename: 'bundle.js'
    },

    module: {
        rules: [
            {
              test: /\.(ttf|otf|eot|svg|woff)(\?[a-z0-9]+)?$/,
              loader: 'ignore-loader',
            },
            {
              test: /\.(woff2)(\?[a-z0-9]+)?$/,
              loader: 'file-loader?name=fonts/[name].[ext]',
            },
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                options: {
                    presets: ['react', 'es2017', 'stage-2'],
                }
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract({
                    loader: 'css-loader'
                })
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                loader: 'file-loader',
                query: {
                    name: '[name].[ext]?[hash]'
                }
            }
        ]
    },

    plugins: [
        new ExtractTextPlugin({
            filename: 'bundle.css',
            disable: false,
            allChunks: true
        }
    )
]

}

const path = require('path')

module.exports = {
  lintOnSave: false,
  configureWebpack: {
    resolve: {
      alias: {
        '@unrest/tetris': path.resolve(__dirname, '../src'),
        '@unrest/geo': path.resolve(__dirname, '../../../Geo/dist/index.js'),
      },
    },
  },
}

module.exports.devServer = {
  host: 'tetris.localhost',
  port: 8101,
  historyApiFallback: true,
}
module.exports.publicPath = '/unrest-tetris/'

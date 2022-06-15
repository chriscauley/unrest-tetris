const path = require('path')

module.exports = {
  lintOnSave: false,
  configureWebpack: {
    resolve: {
      alias: {
        '@unrest/tetris': path.resolve(__dirname, '../src'),
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

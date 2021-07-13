const path = require('path')

module.exports = {
  resolve: {
    alias: {
      '@unrest/geo': path.resolve(__dirname, '../../Geo/src/index.js'),
    }
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: '@unrest/tetris'
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
}
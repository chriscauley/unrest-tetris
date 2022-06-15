const path = require('path')

module.exports = {
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
import debug from './debug'

export default {
  install(app) {
    app.config.globalProperties.$store = {
      debug,
    }
  },
}

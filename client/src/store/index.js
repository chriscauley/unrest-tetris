import debug from './debug'
import new_game from './new_game'

export default {
  install(app) {
    app.config.globalProperties.$store = {
      debug,
      new_game,
    }
  },
}

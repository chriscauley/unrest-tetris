import debug from './debug'
import game from './game'
import new_game from './new_game'

export default {
  install(app) {
    app.config.globalProperties.$store = {
      debug,
      game,
      new_game,
    }
  },
}

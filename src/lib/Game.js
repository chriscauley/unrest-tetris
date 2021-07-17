import Board from './Board'

export default class Game {
  constructor(options = {}) {
    this.options = options
    this.reset()
  }
  reset() {
    const { seed, id, actions, hash } = this.options
    this.board = new Board({ seed, id, actions, hash })
    this.board.start()
  }
  input(action) {
    clearTimeout(this.timeout)
    const actions = {
      rotate: ['rotateCurrent', 1],
      left: ['moveCurrentLeft'],
      right: ['moveCurrentRight'],
      down: ['moveCurrentDown'],
      drop: ['dropCurrent'],
      lock: ['nextTurn'],
    }
    this.board.doAction(...actions[action])
  }
  on(action, f) {
    this.board.mitt.on(action, f)
  }
}

import Board from './Board'

export default class Game {
  constructor(options = {}) {
    this.options = options
    this.reset()
  }
  reset() {
    const { seed, id, actions, hash, b } = this.options
    this.board = new Board({ seed, id, actions, hash, b })
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
      swap: ['swap'],
    }
    this.board.doAction(...actions[action])
  }
  on(action, f) {
    this.board.mitt.on(action, f)
  }
}

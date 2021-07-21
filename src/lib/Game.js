import Board from './Board'

// TODO board.rotateRight and board.rotateLeft would remove the need for the array
const actions = {
  rotate: ['rotateCurrent', 1],
  left: ['moveCurrentLeft'],
  right: ['moveCurrentRight'],
  down: ['moveCurrentDown'],
  drop: ['dropCurrent'],
  lock: ['lock'],
  pause: ['pause'],
  swap: ['swap'],
}

export default class Game {
  constructor(options = {}) {
    this.options = options
    this.reset()
    this.paused = false
    this.pause = () => {
      // TODO class properties
      this.paused = true
      this.board.pause()
    }
  }
  reset() {
    const { seed, id, actions, hash, b, buffer, scale } = this.options
    this.board = new Board({ seed, id, actions, hash, b, buffer, scale })
    this.board.start()
  }
  input(action) {
    clearTimeout(this.timeout)
    this.board.doAction(...actions[action])
  }
  on(action, f) {
    this.board.mitt.on(action, f)
  }
  resume() {
    this.paused = false
    this.board.resume()
  }
}

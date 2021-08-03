import cloneDeep from 'lodash.clonedeep'
import Piece from './Piece'

const { ASH } = Piece

const b0 = {
  getRemaining: (board) => {
    const indexes = board.entities[ASH]?.indexes?.map(board.geo.index2xy) || []
    return [...new Set(indexes.map((xy) => xy[1]))].length
  },
  getRemainingText: (board) => `${b0.getRemaining(board)} lines left`,
  getOptions: (options, level) => {
    options = cloneDeep(options)
    options.name = `${options.mode.name} ${level}`
    options.mode.level = level
    options.rules.b.lines = 4 * level
    return options
  },
}

export default { b0 }

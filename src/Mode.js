import cloneDeep from 'lodash.clonedeep'
import Piece from './Piece'

const { ASH } = Piece

const b0 = {
  bind(board) {
    const { mode } = board.options
    const getRemaining = () => {
      const indexes = board.entities[ASH]?.indexes?.map(board.geo.index2xy) || []
      return [...new Set(indexes.map((xy) => xy[1]))].length
    }
    return {
      getRemaining,
      getRemainingText: () => `${getRemaining(board)} lines left`,
      nextLevelText: `Advance to ${mode.name} ${mode.level + 1}`,
      nextLevelOptions: b0.getOptions(board.options, mode.level + 1),
    }
  },

  getOptions: (options, level) => {
    options = cloneDeep(options)

    // TODO maybe Options.reset (could also have Options.makeDefault from Board.makeDefaultOptions)
    delete options.hash
    delete options.id
    delete options.actions

    options.name = `${options.mode.name} ${level}`
    options.mode.level = level
    options.rules.b.lines = 4 * level
    return options
  },
}

export default { b0 }

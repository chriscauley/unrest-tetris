import Piece from './Piece'
import Geo, { mod, vector } from '@unrest/geo'

const range = (len) => new Array(len).fill(0).map((_, i) => i)

const B = {
  new: (options = {}) => {
    const { W = 10, H = 20 } = options
    const geo = new Geo(W, H)
    const start = options.start || geo.xy2index([Math.floor(W / 2) - 1, 1])
    const _id = 1
    const xs = range(W)
    return {
      W,
      H,
      entities: {},
      indexes: {},
      geo,
      start,
      _id,
      xs,
      actions: [],
    }
  },
  addPiece: (board, shape) => {
    const { dxys } = Piece[shape]
    const xys = dxys.map((dxy) => vector.add(board.geo.index2xy(board.start), dxy))
    const id = board._id++
    const block_ids = range(xys.length)
    const piece = { id, shape, spin: 0, index: board.start, indexes: [], block_ids }
    board.current_piece = board.entities[id] = piece

    B._placePiece(board, piece.id, xys)
  },
  rotateCurrent: (board, dspin) => {
    const piece = board.current_piece
    const { dxys, max_spin } = Piece[piece.shape]
    if (max_spin === 0) {
      return // 'o' or square piece cannot rotate
    }

    const new_spin = mod(piece.spin + dspin, max_spin)
    const [old_x, old_y] = board.geo.index2xy(piece.index)
    const new_dxys = dxys.map(([dx, dy]) => {
      if (new_spin === 0) {
        return [dx, dy]
      } else if (new_spin === 1) {
        return [-dy, -dx]
      } else if (new_spin === 2) {
        return [-dx, -dy]
      }
      return [dy, dx]
    })

    const new_xys = new_dxys.map((dxy) => [old_x + dxy[0], old_y + dxy[1]])
    B._placePiece(board, piece.id, new_xys)

    // all good, set piece
    piece.spin = new_spin
  },
  moveCurrent(board, dxy) {
    const piece = board.current_piece
    const new_xys = piece.indexes.map(board.geo.index2xy).map((xy) => vector.add(xy, dxy))
    B._placePiece(board, piece.id, new_xys)
    piece.index = vector.add(board.geo.index2xy(piece.index), dxy)
  },
  moveCurrentDown(board) {
    const old_index = board.current_piece.index
    B.moveCurrent(board, [0, 1])
    if (old_index !== board.current_piece.index) {
      B.nextTurn(board)
    }
  },
  _placePiece(board, piece_id, new_xys) {
    const new_indexes = new_xys.map(board.geo.xy2index)

    // check to make sure piece doesn't collide with anything
    if (new_xys.find((xy) => !board.geo.inBounds(xy))) {
      throw `Unable to place: ${new_xys.join('|')} not in bounds`
    }
    if (new_indexes.map((index) => board.indexes[index]).find((id) => id && id !== piece_id)) {
      throw 'Unable to place piece due to collision'
    }

    const piece = board.entities[piece_id]
    piece.indexes.forEach((index) => delete board.indexes[index])
    new_indexes.forEach((index) => (board.indexes[index] = piece.id))
    piece.indexes = new_indexes
  },
  dropCurrent(board) {
    for (let dy = 0; dy < board.geo.H; dy++) {
      try {
        B.moveCurrent(board, [0, 1])
      } catch (_e) {
        continue
      }
    }
  },
  nextTurn(board) {
    const piece = board.current_piece
    const ys = [...new Set(piece.indexes.map(board.geo.index2xy).map((xy) => xy[1]))]
    const delete_ys = ys.filter((y) => {
      const first_empty_x = board.xs.find((x) => !board.indexes[board.geo.xy2index([x, y])])
      return first_empty_x === undefined
    })
    delete_ys.sort()
    delete_ys.forEach((y) => B.removeLine(board, y))
  },
  removeLine(board, y) {
    const moved = {}
    const { W, xy2index } = board.geo
    const min_index = xy2index([0, y])
    board.xs.forEach((x) => {
      const index = xy2index([x, y])
      const piece_id = board.indexes[index]
      delete board.indexes[index]
      if (!moved[piece_id]) {
        const piece = board.entities[piece_id]
        const delete_blocks = []
        piece.indexes.forEach((i, block_index) => {
          if (board.geo.index2xy(i)[1] === y) {
            delete_blocks.push(block_index)
          }
        })
        piece.indexes = piece.indexes.filter(
          (_, block_index) => !delete_blocks.includes(block_index),
        )
        moved[piece_id] = true
        // piece.indexes = piece.indexes.filter((i) => i !== index)
        if (!piece.indexes.length) {
          delete board.entities[piece_id]
        }
      }
    })
    const new_entries = Object.entries(board.indexes).map(([index, piece_id]) => {
      index = Number(index)
      if (index < min_index) {
        index += W
      }
      return [index, piece_id]
    })
    board.indexes = Object.fromEntries(new_entries)
    Object.values(board.entities).forEach((piece) => {
      piece.indexes = piece.indexes.map((i) => (i < min_index ? i + W : i))
    })
  },
  doAction(board, action, ...args) {
    board.actions.push([action, ...args])
    try {
      B[action](board, ...args)
    } catch (e) {}
  },
}

export default B

import Piece from './Piece'
import Geo, { mod, vector } from '@unrest/geo'

const B = {
  new: (options = {}) => {
    const { W = 10, H = 20 } = options
    const geo = new Geo(W, H)
    const start = options.start || geo.xy2index([Math.floor(W / 2) - 1, 1])
    const _id = 1
    return { W, H, entities: {}, indexes: {}, geo, start, _id }
  },
  addPiece: (board, shape) => {
    const { dxys } = Piece[shape]
    const xys = dxys.map((dxy) => vector.add(board.geo.index2xy(board.start), dxy))
    const id = board._id++
    const piece = { id, shape, spin: 0, index: board.start, indexes: [] }
    board.current_piece = board.entities[id] = piece

    B._placePiece(board, piece.id, xys)
  },
  rotatePiece: (board, piece_id, dspin) => {
    const piece = board.entities[piece_id]
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
    B._placePiece(board, piece_id, new_xys)

    // all good, set piece
    piece.spin = new_spin
  },
  movePiece(board, piece_id, dxy) {
    const piece = board.entities[piece_id]
    const new_xys = piece.indexes.map(board.geo.index2xy).map((xy) => vector.add(xy, dxy))
    B._placePiece(board, board.current_piece.id, new_xys)
    piece.index = vector.add(board.index2xy(piece.index), dxy)
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
  dropPiece(board, piece_id) {
    for (let dy = 0; dy < board.geo.H; dy++) {
      try {
        B.movePiece(board, piece_id, [0, 1])
      } catch (_e) {
        continue
      }
    }
  },
}

export default B

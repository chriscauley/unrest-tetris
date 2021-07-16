import Piece from './Piece'
import Geo, { mod, vector } from '@unrest/geo'

const range = (len) => new Array(len).fill(0).map((_, i) => i)

export default class Board {
  constructor(options = {}) {
    this.options = options
    const { W = 10, H = 20 } = options
    const geo = new Geo(W, H)
    Object.assign(this, {
      entities: {},
      indexes: {},
      geo,
      start_xy: options.start_xy || geo.xy2index([Math.floor(W / 2) - 1, 1]),
      _id: 1,
      xs: range(W),
      actions: [],
    })
  }
  addPiece(shape) {
    const { dxys } = Piece[shape]
    const xys = dxys.map((dxy) => vector.add(this.geo.index2xy(this.start), dxy))
    const id = this._id++
    const block_ids = range(xys.length)
    const piece = { id, shape, spin: 0, index: this.start, indexes: [], block_ids }
    this.current_piece = this.entities[id] = piece

    this._placePiece(piece.id, xys)
  }
  rotateCurrent(dspin) {
    const piece = this.current_piece
    const { dxys, max_spin } = Piece[piece.shape]
    if (max_spin === 0) {
      return // 'o' or square piece cannot rotate
    }

    const new_spin = mod(piece.spin + dspin, max_spin)
    const [old_x, old_y] = this.geo.index2xy(piece.index)
    const new_dxys = dxys.map(([dx, dy]) => {
      if (new_spin === 0) {
        return [dx, dy]
      } else if (new_spin === 1) {
        return [dy, -dx]
      } else if (new_spin === 2) {
        return [-dx, -dy]
      }
      return [-dy, dx]
    })

    const new_xys = new_dxys.map((dxy) => [old_x + dxy[0], old_y + dxy[1]])
    this._placePiece(piece.id, new_xys)

    // all good, set piece
    piece.spin = new_spin
  }
  moveCurrent(dxy) {
    const piece = this.current_piece
    const new_xys = piece.indexes.map(this.geo.index2xy).map((xy) => vector.add(xy, dxy))
    this._placePiece(piece.id, new_xys)
    piece.index = this.geo.xy2index(vector.add(this.geo.index2xy(piece.index), dxy))
  }
  moveCurrentDown() {
    // down has the potential to lock and clear (next turn)
    const old_index = this.current_piece.index
    this.moveCurrent([0, 1])
    if (old_index === this.current_piece.index) {
      this.nextTurn()
    }
  }
  _placePiece(piece_id, new_xys) {
    const new_indexes = new_xys.map(this.geo.xy2index)

    // check to make sure piece doesn't collide with anything
    if (new_xys.find((xy) => !this.geo.inBounds(xy))) {
      throw `Unable to place: ${new_xys.join('|')} not in bounds`
    }
    if (new_indexes.map((index) => this.indexes[index]).find((id) => id && id !== piece_id)) {
      throw 'Unable to place piece due to collision'
    }

    const piece = this.entities[piece_id]
    piece.indexes.forEach((index) => delete this.indexes[index])
    new_indexes.forEach((index) => (this.indexes[index] = piece.id))
    piece.indexes = new_indexes
  }
  dropCurrent() {
    for (let dy = 0; dy < this.geo.H; dy++) {
      try {
        this.moveCurrent([0, 1])
      } catch (_e) {
        continue
      }
    }
  }
  nextTurn() {
    const piece = this.current_piece
    const ys = [...new Set(piece.indexes.map(this.geo.index2xy).map((xy) => xy[1]))]
    const delete_ys = ys.filter((y) => {
      const first_empty_x = this.xs.find((x) => !this.indexes[this.geo.xy2index([x, y])])
      return first_empty_x === undefined
    })
    delete_ys.sort()
    delete_ys.forEach((y) => this.removeLine(y))
  }
  removeLine(y) {
    const moved = {}
    const { W, xy2index } = this.geo
    const min_index = xy2index([0, y])
    this.xs.forEach((x) => {
      const index = xy2index([x, y])
      const piece_id = this.indexes[index]
      delete this.indexes[index]
      if (!moved[piece_id]) {
        const piece = this.entities[piece_id]
        const delete_blocks = []
        piece.indexes.forEach((i, block_index) => {
          if (this.geo.index2xy(i)[1] === y) {
            delete_blocks.push(block_index)
          }
        })
        piece.indexes = piece.indexes.filter(
          (_, block_index) => !delete_blocks.includes(block_index),
        )
        moved[piece_id] = true
        // piece.indexes = piece.indexes.filter((i) => i !== index)
        if (!piece.indexes.length) {
          delete this.entities[piece_id]
        }
      }
    })
    const new_entries = Object.entries(this.indexes).map(([index, piece_id]) => {
      index = Number(index)
      if (index < min_index) {
        index += W
      }
      return [index, piece_id]
    })
    this.indexes = Object.fromEntries(new_entries)
    Object.values(this.entities).forEach((piece) => {
      piece.indexes = piece.indexes.map((i) => (i < min_index ? i + W : i))
    })
  }
  doAction(action, ...args) {
    this.actions.push([action, ...args])
    try {
      this[action](...args)
    } catch (e) {}
  }
}

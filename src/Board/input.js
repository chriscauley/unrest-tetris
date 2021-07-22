import { mod } from '@unrest/geo'

export default {
  rotate(dspin = 1) {
    const { shape, index, spin, id } = this.current_piece

    const new_spin = mod(spin + dspin, 4)
    const new_indexes = this._rotation_cache[shape][new_spin].map((dindex) => dindex + index)
    const collision = new_indexes.map((i) => this.indexes[i]).find((_id) => _id && _id !== id)
    if (collision === undefined) {
      // all good, set piece
      this.current_piece.spin = new_spin
      this._placePiece(id, new_indexes)
      this.redraw()
    }
  },

  _moveCurrent(dindex) {
    const piece = this.current_piece
    const new_indexes = piece.indexes.map((i) => i + dindex)
    this._placePiece(piece.id, new_indexes)
    piece.index += dindex
  },

  down() {
    // down has the potential to lock and clear (next turn)
    if (this.canMoveCurrent(this.geo.W)) {
      this._moveCurrent(this.geo.W)
    } else {
      this.nextTurn()
    }
    this.redraw()
  },

  left() {
    if (this.canMoveCurrent(-1)) {
      this._moveCurrent(-1)
      this.redraw()
    }
  },

  right() {
    if (this.canMoveCurrent(1)) {
      this._moveCurrent(1)
      this.redraw()
    }
  },

  drop() {
    this._dropping = true
    let dy = 1
    while (dy < this.geo.H) {
      if (!this.canMoveCurrent(this.geo.W * dy)) {
        break
      }
      dy++
    }
    dy--
    this._moveCurrent(dy * this.geo.W)
    this.redraw()
  },

  lock() {
    // don't "lock" if someone drops (keydown.space), then swaps, then locks (keyup.space)
    if (this._dropping) {
      this.dropCurrent()
      this.nextTurn()
    }
    delete this._dropping
  },
}

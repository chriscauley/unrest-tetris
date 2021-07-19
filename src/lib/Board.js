import Geo, { mod } from '@unrest/geo'
import mitt from 'mitt'
import Hash from 'object-hash'

import Piece from './Piece'
import Btype from './Btype'

const range = (len) => new Array(len).fill(0).map((_, i) => i)
const WALL = 'W'
const ASH = 'A'

const alphanum = '1234567890abcdefghijklmnopqrstuvwxyz'

export default class Board {
  constructor({ id, ...options } = {}) {
    window.b = this
    this.options = options
    let { W = 10, H = 20 } = options

    // expand geometry for floor and wall
    H++
    if (!options.wrap) {
      W += 2
    }

    const geo = new Geo(W, H)
    Object.assign(this, {
      ASH,
      WALL,
      id,
      entities: {},
      indexes: {},
      geo,
      start_index: options.start_index || geo.xy2index([Math.floor(W / 2) - 1, 1]),
      _id: 1,
      xs: range(W),
      actions: [],
      generator: Piece.generator(options.seed),
      ghost: null,
      mitt: mitt(),
      piece_queue: [],
    })

    this.cacheRotations()

    const wall = (this.entities[WALL] = {
      shape: WALL,
      id: WALL,
      indexes: range(W).map((x) => x + (H - 1) * W),
    })
    if (!options.wrap) {
      range(H - 1).map((y) => {
        wall.indexes.push(y * W)
        wall.indexes.push(y * W + W - 1)
      })

      // no longer check wall when removing a line
      this.xs.shift()
      this.xs.pop()
    }

    wall.block_ids = wall.indexes
    this._placePiece(WALL, wall.indexes)

    this.makeAsh()

    const { actions, hash } = this.options
    this.nextTurn()
    if (actions) {
      let new_hash
      actions.forEach(({ index, spin, swap }) => {
        if (swap) {
          this.swap()
        } else {
          this.current_piece.index = index
          this.rotateCurrent(spin)
          this.nextTurn()
          new_hash = Hash(this.indexes)
        }
      })
      if (hash !== new_hash) {
        console.warn('hash mis-match')
      }
    }
  }

  print() {
    console.log( // eslint-disable-line
      this.geo.print(
        Object.fromEntries(
          Object.entries(this.indexes).map(([index, piece_id]) => {
            if ([WALL, ASH].includes(piece_id)) {
              return [index, piece_id]
            }
            return [index, alphanum[piece_id % alphanum.length]]
          }),
        ),
      ),
    )
  }

  makeAsh() {
    const { b } = this.options
    if (!b?.lines) {
      return
    }
    const ash = (this.entities[ASH] = {
      shape: ASH,
      id: ASH,
      indexes: [],
    })
    range(b.lines).forEach((dy) => {
      const y = this.geo.H - dy - 2
      this.xs.forEach((x) => ash.indexes.push(this.geo.xy2index([x, y])))
    })
    let i = 0
    const removes = {}
    const f = Btype[b.algorithm](b.seed)
    while (i < ash.indexes.length) {
      i += f()
      removes[i] = true
    }
    ash.indexes = ash.indexes.filter((_, i) => !removes[i])
    ash.block_ids = ash.indexes
    this._placePiece(ASH, ash.indexes)
  }
  start() {
    this.setLevel(1)
    // this.resume()
    // this.nextTurn()
  }
  serialize() {
    const { actions, id } = this
    const hash = Hash(this.indexes)
    return { ...this.options, actions, hash, id }
  }
  setLevel(level) {
    this.level = level
    this.game_speed = 500
  }
  swap() {
    const { shape, indexes, id } = this.current_piece
    indexes.forEach((i) => delete this.indexes[i])
    delete this.entities[id]
    this.addPiece(this.stash)
    this.stash = shape
    this.actions.push({ swap: true })
  }
  nextTurn() {
    const piece = this.current_piece
    if (piece) {
      const ys = [...new Set(piece.indexes.map(this.geo.index2xy).map((xy) => xy[1]))]
      const delete_ys = ys.filter((y) => {
        for (let x of this.xs) {
          if (!this.indexes[this.geo.xy2index([x, y])]) {
            return false
          }
        }
        return true
      })
      delete_ys.sort((a, b) => a - b)
      delete_ys.forEach((y) => this.removeLine(y))
      const { index, spin } = this.current_piece
      this.actions.push({ index, spin })
    }
    this.addPiece()
    this.mitt.emit('save')
    this.redraw()
  }
  addPiece(shape) {
    if (!shape) {
      while (this.piece_queue.length < 9) {
        this.piece_queue.push(this.generator())
      }
      shape = this.piece_queue.shift()
    }
    const { dxys } = Piece[shape]
    const dindexes = dxys.map(this.geo.dxy2dindex)
    const indexes = dindexes.map((dindex) => dindex + this.start_index)
    const id = this._id++
    const block_ids = range(indexes.length)
    const piece = { id, shape, spin: 0, index: this.start_index, indexes: [], block_ids }
    this.current_piece = this.entities[id] = piece

    this._placePiece(piece.id, indexes)
  }
  cacheRotations() {
    this._rotation_cache = {}
    Piece.all.forEach(({ shape, dxys, max_spin }) => {
      this._rotation_cache[shape] = {}
      range(4).forEach((spin) => {
        const adjusted_spin = spin % max_spin
        const new_dxys = dxys.map(([dx, dy]) => {
          if (adjusted_spin === 0) {
            return [dx, dy]
          } else if (adjusted_spin === 1) {
            return [-dy, dx]
          } else if (adjusted_spin === 2) {
            return [-dx, -dy]
          }
          return [dy, -dx]
        })
        this._rotation_cache[shape][spin] = new_dxys.map(this.geo.dxy2dindex)
      })
    })
  }
  rotateCurrent(dspin) {
    const { shape, index, spin, id } = this.current_piece

    const new_spin = mod(spin + dspin, 4)
    const new_indexes = this._rotation_cache[shape][new_spin].map((dindex) => dindex + index)
    this._placePiece(id, new_indexes)

    // all good, set piece
    this.current_piece.spin = new_spin
    this.redraw()
  }
  moveCurrent(dindex) {
    const piece = this.current_piece
    const new_indexes = piece.indexes.map((i) => i + dindex)
    this._placePiece(piece.id, new_indexes)
    piece.index += dindex
  }
  moveCurrentDown() {
    // down has the potential to lock and clear (next turn)
    try {
      this.moveCurrent(this.geo.W)
    } catch (_e) {
      this.nextTurn()
    }
    this.redraw()
  }
  moveCurrentLeft() {
    this.moveCurrent(-1)
    this.redraw()
  }
  moveCurrentRight() {
    this.moveCurrent(1)
    this.redraw()
  }
  redraw() {
    this.ghost = this.current_piece.indexes
    const { W, H } = this.geo
    const max_index = W * H - 1
    let _h = H
    while (_h--) {
      const new_ghost = this.ghost.map((i) => i + W)
      const collides = new_ghost.find((index) => {
        if (index > max_index) {
          return true
        }
        if (this.indexes[index] === undefined) {
          return false
        }
        return this.indexes[index] !== this.current_piece.id
      })
      if (collides !== undefined) {
        break
      }
      this.ghost = new_ghost
    }
  }
  _placePiece(piece_id, new_indexes) {
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
        this.moveCurrent(this.geo.W)
      } catch (_e) {
        continue
      }
    }
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
      if (piece_id !== this.WALL && index < min_index) {
        index += W
      }
      return [index, piece_id]
    })
    this.indexes = Object.fromEntries(new_entries)
    Object.values(this.entities).forEach((piece) => {
      if (piece.id !== this.WALL) {
        piece.indexes = piece.indexes.map((i) => (i < min_index ? i + W : i))
      }
    })
  }
  doAction(action, ...args) {
    try {
      this[action](...args)
    } catch (e) {}
  }
  tick() {
    clearTimeout(this.timeout)
    this.moveCurrentDown()
    this.timeout = setTimeout(() => this.tick(), this.game_speed)
  }
  pause() {
    clearTimeout(this.timeout)
  }
  resume() {
    clearTimeout(this.timeout)
    this.timeout = setTimeout(() => this.tick(), this.game_speed)
  }
}

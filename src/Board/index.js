import Geo from '@unrest/geo'
import mitt from 'mitt'
import Hash from 'object-hash'
import cloneDeep from 'lodash.clonedeep'

import Campaign from '../Campaign'
import Btype from '../Btype'
import Piece from '../Piece'
import Renderer from '../Renderer'
import _actions from './_actions'

const { WALL, ASH, HOT, COLD } = Piece

const range = (len) => new Array(len).fill(0).map((_, i) => i)

const VISIBLE = 22
const SPACE_TO_SKY = Math.ceil(VISIBLE / 4)
const PLAYABLE_LINES = VISIBLE - SPACE_TO_SKY

const alphanum = '0123456789abcdefghijklmnopqrstuvwxyz'

const getDefaultOptions = ({ rules = {}, ...options } = {}) => {
  const { W = 10, H = 60 } = options
  options._geo = { W, H }

  // expand geometry for floor and wall
  options._geo.H++
  if (!options.wrap) {
    options._geo.W += 2
  }
  return { ...options, W, H, rules }
}

export default class Board {
  constructor({ id, render_options = {}, ...options } = {}) {
    window.b = this
    Object.assign(this, _actions)
    this.options = getDefaultOptions(options)

    const { W, H } = this.options._geo
    const geo = new Geo(W, H)
    Object.assign(this, {
      id,
      entities: {},
      indexes: {},
      geo,
      start_index: geo.xy2index([Math.floor(W / 2) - 1, 1]),
      _id: 1,
      xs: range(W),
      actions: [],
      generator: Piece.generator(this.options.rules.seed),
      ghost: null,
      mitt: mitt(),
      piece_queue: [],
      renderer: new Renderer(this, render_options),
    })

    this.cacheRotations()

    this.makeWall()
    this.makeAsh()

    this.nextTurn()
    this.campaign = Campaign.get({ key: this.options.campaign?.key })
    this.options.actions && this.replayPreviousGame()
  }

  replayPreviousGame() {
    // replay previous game
    let new_hash
    try {
      this.options.actions.forEach(({ index, spin, swap }) => {
        if (swap) {
          this.swap()
        } else {
          if (spin) {
            this.rotate(spin) // does renderer.moveCurrent
          }
          if (index - this.current_piece.index) {
            const [x, y] = this.geo.index2xy(index)
            const [old_x, old_y] = this.geo.index2xy(this.current_piece.index)
            const dy = y - old_y
            const dx = x - old_x
            if (dx) {
              this._moveCurrent(dx)
              this.renderer.moveCurrent()
            }
            if (dy) {
              this._moveCurrent(dy * this.geo.W)
              this.renderer.moveCurrent()
            }
          }
          this.nextTurn()
          new_hash = Hash(this.indexes)
        }
      })
    } catch (_e) {
      console.error(`replay failed on step ${this.actions.length}/${this.options.actions.length}`)
      console.error(_e)
    }
    if (this.options.hash !== new_hash) {
      console.warn('hash mis-match')
    }
  }

  get turn() {
    return this.actions.length + 1
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

  makeWall() {
    const { H, W } = this.geo
    const indexes = range(W).map((x) => x + (H - 1) * W) // floor indexes
    if (!this.options.wrap) {
      range(H - 1).map((y) => {
        indexes.push(y * W)
        indexes.push(y * W + W - 1)
      })

      // no longer check wall xs when removing a line
      this.xs.shift()
      this.xs.pop()
    }
    this._newPiece({ shape: WALL, id: WALL, indexes })
  }

  _checkAndSplit(piece) {
    const _checked = {}
    const keep = []
    const _check = (index) => {
      if (_checked[index] || this.indexes[index] !== piece.id) {
        return
      }
      keep.push(index)
      _checked[index] = true
      this.geo.dindexes.forEach((dindex) => _check(dindex + index))
    }
    _check(piece.indexes[0])
    if (keep.length !== piece.indexes.length) {
      const remaining = piece.indexes.filter((i) => !keep.includes(i))
      piece.block_ids = keep.map((index) => piece.block_ids[piece.indexes.indexOf(index)])
      piece.indexes = keep
      this._placePiece(piece)

      remaining.forEach((i) => delete this.indexes[i])
      const new_piece = this._newPiece({
        shape: piece.shape,
        index: remaining[0],
        indexes: remaining,
      })
      this._checkAndSplit(new_piece)
    }
  }

  splitAndMerge(_max_y) {
    // first split any pieces that have lost blocks
    Object.keys(this._removed_pieces_by_id)
      .map((i) => this.entities[i])
      .filter((piece) => piece && piece.id !== ASH)
      .forEach((piece) => this._checkAndSplit(piece))

    // TODO this would be optimized a bit by only checking above _max_y
    if (this.options.rules.sticky) {
      Object.values(this.entities).forEach((piece) => {
        if (this.entities[piece.id]) {
          // piece may have been deleted in previous iterations!
          this.checkAndStick(piece)
        }
      })
    }
  }

  checkAndCascade() {
    this._fixed_pieces = { [WALL]: true }
    const { W, H } = this.geo
    const to_check = range(W).map((i) => i + W * (H - 1))
    const checked_pieces = {}
    const checked = {}
    let _max = 10000 // TODO this is to prevent infinte loop. Can probably be removed
    while (to_check.length && _max--) {
      const index = to_check.pop()
      checked[index] = (checked[index] || 0) + 1
      checked_pieces[this.indexes[index]] = true
      const target_index = index - W
      const target_id = this.indexes[target_index]
      if (!checked_pieces[target_id]) {
        const target_piece = this.entities[target_id]
        target_piece?.indexes.forEach((i) => {
          to_check.push(i)
          this._fixed_pieces[target_piece.id] = true
        })
      }
    }
    if (_max < 1) {
      // _max is -1 if while loop overflowed
      throw 'Unable to solve cascade'
    }
    const loose_pieces = Object.values(this.entities).filter((p) => !this._fixed_pieces[p.id])
    loose_pieces.forEach((p) => p.indexes.forEach((i) => delete this.indexes[i]))
    loose_pieces.forEach((p) => {
      p.indexes = p.indexes.map((i) => i + W)
      this._placePiece(p)
    })
    if (loose_pieces.length) {
      this.checkAndCascade()
    }
    return loose_pieces
  }

  checkAndStick(piece) {
    const merge = {}
    piece.indexes.forEach((index) => {
      this.geo.dindexes.forEach((dindex) => {
        const target_index = index + dindex
        const target_id = this.indexes[target_index]
        const target = this.entities[target_id]
        if (target && target !== piece && target.shape === piece.shape) {
          merge[target_id] = target
        }
      })
    })
    Object.values(merge).forEach((target_piece) => {
      piece.indexes = piece.indexes.concat(target_piece.indexes)
      const max = Math.max(...piece.indexes)
      piece.block_ids = range(piece.indexes.length).map((i) => i + max)
      target_piece.indexes.forEach((i) => delete this.indexes[i])
      delete this.entities[target_piece.id]
    })
    if (Object.keys(merge).length > 0) {
      this._placePiece(piece)
    }
  }

  makeAsh() {
    const { b = {} } = this.options.rules
    if (!b.lines || !b.algorithm) {
      return
    }
    let indexes = []
    range(b.lines).forEach((dy) => {
      const y = this.geo.H - dy - 2
      this.xs.forEach((x) => indexes.push(this.geo.xy2index([x, y])))
    })
    let i = 0
    const removes = {}
    const f = Btype[b.algorithm](b.seed)
    while (i < indexes.length) {
      i += f()
      removes[i] = true
    }
    indexes = indexes.filter((_, i) => !removes[i])
    this._newPiece({ shape: ASH, id: ASH, indexes })
  }

  start() {
    // this.resume()
    // this.nextTurn()
  }

  serialize() {
    const { actions, id } = this
    const hash = Hash(this.indexes)
    return { ...this.options, actions, hash, id }
  }

  swap() {
    delete this._dropping // see note in this.lock
    const { shape, indexes, id } = this.current_piece
    indexes.forEach((i) => delete this.indexes[i])
    delete this.entities[id]
    this.addPiece(this.stash)
    this.stash = shape
    this.actions.push({ swap: true })
    this.renderer.stash(this.current_piece, id)
  }

  _lineWillClear(y) {
    const ids = this.geo.getRowIndexes(y).map((i) => this.indexes[i])
    for (let id of ids) {
      if (id === undefined) {
        return false
      }
    }
    return true
  }

  updateBoard(pieces) {
    const indexes = []
    pieces.forEach((p) => p.indexes.forEach((i) => indexes.push(i)))
    const ys = range(PLAYABLE_LINES)
      .map((dy) => this._sealevel - 1 - dy)
      .filter((y) => y >= this._min_y)
    const delete_ys = ys.filter((y) => this._lineWillClear(y))
    this._removed_pieces_by_id = {}
    this._checkAndNuke(delete_ys)
    this._cleared_current = []
    this._cleared_hot_cold = {}
    delete_ys.sort((a, b) => a - b)
    delete_ys.forEach((y) => this.removeLine(y))
    this.renderer.flashLines(delete_ys)
    this.splitAndMerge(Math.max(...ys))

    const moved_nukes = []
    Object.entries(this._cleared_hot_cold).forEach(([index, piece]) => {
      index = Number(index)
      piece.charges--
      if (piece.charges < 1) {
        // TODO fusion pieces might be able to explode (depth charges, shattering sticky pieces)
        // TODO animate
        return
      }

      // shift index down one row for every row under it removed
      const index_y = this.geo.index2xy(index)[1]
      index += delete_ys.filter((y) => index_y < y).length * this.geo.W

      if (piece.shape === HOT) {
        this._placeHotPiece(piece, Number(index))
      } else {
        // piece.shape === COLD
        this._placeColdPiece(piece, Number(index))
      }
      moved_nukes.push(piece)
    })
    moved_nukes.length && this.renderer.moveNukes(moved_nukes)

    const check_cascade =
      (delete_ys.length && this.options.rules.cascade) ||
      Object.keys(this._cleared_hot_cold).length > 0
    if (check_cascade) {
      this.checkAndCascade()
    }
  }

  _validateIndex(index) {
    if (index >= this.geo.AREA) {
      throw 'Cascade of hot/cold piece failed'
    }
  }

  _cascadeHotCold(piece, index) {
    this._validateIndex(index)
    while (index < this.geo.AREA) {
      // This loop basically just "cascades" until it hits a piece
      if (this.indexes[index + this.geo.W]) {
        break
      }
      index += this.geo.W
    }
    this._validateIndex(index)
    piece.index = index
    piece.indexes = [index]
    this._placePiece(piece)
  }

  _placeColdPiece(piece, index) {
    while (index < this.geo.AREA) {
      index += this.geo.W
      // phase through pieces until there's an empty spot
      if (this.indexes[index] === WALL) {
        // TODO score remaining charges
        // TODO animate
        return
      }
      const target_piece = this.entities[this.indexes[index]]
      if (!target_piece) {
        break
      }
      if (target_piece.shape === HOT) {
        // TODO right now hot/cold phase through each other. Maybe detonate?
        continue
      }
    }
    this._cascadeHotCold(piece, index)
  }

  _placeHotPiece(piece, index) {
    while (index < this.geo.AREA) {
      index += this.geo.W
      const target_piece = this.entities[this.indexes[index]]
      if (!target_piece) {
        // empty space, time to cascade
        break
      }
      if (target_piece.shape === COLD) {
        // TODO right now hot/cold phase through each other. Maybe detonate?
        continue
      }
      if (target_piece.shape === HOT) {
        // when hot collides with hot, move lower hot down one
        // net result is a column of HOT all go down one row
        this._removeBlock(index)
        this._placeHotPiece(target_piece, index)
        break
      }
      if (target_piece.shape === WALL) {
        // TODO score remaining charges
        // TODO animate
        return
      }
      // melt whatever piece was there
      // TODO animate
      this._removeBlock(index)
      break
    }
    this._cascadeHotCold(piece, index)
  }

  _isNuclear(type, indexes) {
    const { index2xy } = this.geo
    const funcs = {
      fusion: (i) => this._lineWillClear(index2xy(i)[1]),
      fission: (i) => !this._lineWillClear(index2xy(i)[1]),
    }
    const nuke_indexes = indexes.filter(funcs[type])
    if (nuke_indexes.length === indexes.length && type === 'fission') {
      // fusion needs to remove at least one line to count
      return []
    }
    return nuke_indexes
  }

  _checkAndNuke(delete_ys) {
    // convert current to hot/cold when fission/fusion is triggered
    const { type, temperature } = this.options.rules?.nuclear || {}
    if (!type) {
      return
    }
    const target_indexes = this._isNuclear(type, this.current_piece.indexes)
    const shape = temperature === 'hot' ? HOT : COLD
    // 1, 2, 3, 4 blocks yields 6, 3, 2, 1 charges per block respectively
    let charges = Math.floor(6 / target_indexes.length)
    if (type === 'fusion') {
      // Since fusion get triggered right after being generated they get an extra charge
      charges++
    }
    const nukes = target_indexes.map((target_index) => {
      this._removeBlock(target_index)
      return this._newPiece({ shape, indexes: [target_index], charges })
    })
    delete_ys.forEach((y) =>
      this.geo.getRowIndexes(y).forEach((index) => {
        // TODO seperate animation for creating nuke vs activating nuke
        const piece = this.entities[this.indexes[index]]
        if ([HOT, COLD].includes(piece.shape) && piece.charges) {
          nukes.push(piece)
        }
      }),
    )
    nukes.length && this.renderer.addNukes(nukes)
  }

  nextTurn() {
    const piece = this.current_piece
    if (piece) {
      const { index, spin } = piece
      this.updateBoard([piece])
      this.actions.push({ index, spin })
    }
    delete this._dropping // see note in this.lock
    const ys = Object.values(this.entities)
      .filter((p) => p.id !== WALL)
      .map((p) => p._min_y)
    this._min_y = Math.min(this.geo.H, ...ys)
    this._skyline = Math.max(SPACE_TO_SKY, this._min_y)
    this._skyline = Math.min(this._skyline, this.geo.H - PLAYABLE_LINES - 1) // -1 is for floor
    this._sealevel = this._skyline + PLAYABLE_LINES
    if (this._min_y <= 4) {
      this.gameover = true
    } else {
      this.addPiece()
    }
    this.mitt.emit('save')
    this.renderer.draw()
  }

  addPiece(shape) {
    if (!shape) {
      while (this.piece_queue.length < 9) {
        this.piece_queue.push(this.generator())
      }
      shape = this.piece_queue.shift()
      this.renderer.markStale('queue')
    }
    const { dxys } = Piece[shape]
    const dindexes = dxys.map(this.geo.dxy2dindex)
    const indexes = dindexes.map((dindex) => dindex + this.start_index)
    this.current_piece = this._newPiece({ shape, spin: 0, index: this.start_index, indexes })
  }

  _newPiece({ ...piece }) {
    if (!piece.id) {
      piece.id = this._id++
    }
    piece.block_ids = piece.indexes.map((i) => `${piece.id}-${i}`)
    this.entities[piece.id] = piece
    this._placePiece(piece)
    return piece
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

  canMoveCurrent(dindex) {
    const target_ids = this.current_piece.indexes.map((i) => this.indexes[i + dindex])
    const collision = target_ids.find((id) => id && id !== this.current_piece.id)
    return collision === undefined
  }

  _placePiece(piece) {
    const _collide_index = piece.indexes.find((index) => {
      const id = this.indexes[index]
      return id && id !== piece.id
    })
    if (_collide_index !== undefined) {
      const targets = piece.indexes.map((i) => [i, this.indexes[i]])
      this.print()
      console.warn(piece) // eslint-disable-line
      console.warn('targets', targets)
      throw 'Unable to place piece due to collision'
    }

    piece._old_indexes
      ?.filter((i) => this.indexes[i] === piece.id)
      .forEach((index) => delete this.indexes[index])
    piece.indexes.forEach((index) => (this.indexes[index] = piece.id))
    this.renderer.markStale(piece.id)
    piece._min_y = Math.floor(Math.min(...piece.indexes) / this.geo.W)
    this.entities[piece.id] = piece // can be removed by removeBlock
    piece._old_indexes = piece.indexes.slice()
  }

  _removeBlock(index) {
    const piece = this.entities[this.indexes[index]]
    const block_index = piece.indexes.indexOf(index)
    piece.indexes.splice(block_index, 1)
    piece.block_ids.splice(block_index, 1)
    delete this.indexes[index]
    if (!piece.indexes.length) {
      delete this.entities[piece.id]
    } else {
      this._removed_pieces_by_id[piece.id] = piece
    }
  }

  removeLine(y) {
    const { W, xy2index } = this.geo
    const min_index = xy2index([0, y])
    this.xs.forEach((x) => {
      const index = xy2index([x, y])
      const piece_id = this.indexes[index]
      if (piece_id === this.current_piece.id) {
        this._cleared_current.push(index)
      }
      const piece = this.entities[piece_id]
      if ([HOT, COLD].includes(piece?.shape)) {
        this._cleared_hot_cold[index] = piece
      }
      this._removeBlock(index)
      this.renderer.markStale(piece_id)
    })
    const new_entries = Object.entries(this.indexes).map(([index, piece_id]) => {
      index = Number(index)
      if (piece_id !== WALL && index < min_index) {
        index += W
      }
      return [index, piece_id]
    })
    this.indexes = Object.fromEntries(new_entries)
    Object.values(this.entities).forEach((piece) => {
      if (piece.id !== WALL) {
        this.renderer.markStale(piece.id)
        piece.indexes = piece.indexes.map((i) => (i < min_index ? i + W : i))
        piece._min_y = Math.floor(Math.min(...piece.indexes) / this.geo.W)
      }
    })
  }

  tick() {
    cancelAnimationFrame(this._frame)
    this._frame = requestAnimationFrame(() => this.tick())
  }

  pause() {
    cancelAnimationFrame(this._frame)
    this._paused_at = new Date().valueOf()
  }

  resume() {
    cancelAnimationFrame(this._frame)
    this._last_move_at = new Date().valueOf() - (this.paused_at - this.last_move_at)
    delete this._paused_at
    this._frame = requestAnimationFrame(() => this.tick())
  }
}

Board.prepOptions = (options) => {
  options = cloneDeep(options)
  const { rules } = options
  rules.seed = (rules.seed || new Date().valueOf() % 256).toString()
  if (rules.b) {
    rules.b.seed = (rules.b.seed || new Date().valueOf() % 256).toString()
  }
  return options
}
